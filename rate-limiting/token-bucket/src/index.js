const express = require('express');
const Redis = require('ioredis');

const app = express();
app.use(express.json());

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const PORT = process.env.PORT || 3004;
// Maximum number of immediate requests a user can make before the bucket is empty.
const BUCKET_CAPACITY = 5;
// Tokens are added back over time. Here we refill 1 token every second.
const REFILL_RATE_PER_SECOND = 1;

redis.on('error', (error) => {
    console.error('Redis connection error:', error.message);
});

const tokenBucketScript = `
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refillRate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local ttl = tonumber(ARGV[4])

-- Read the current bucket state from Redis.
-- tokens = how many requests the user can still make right now
-- lastRefill = when we last recalculated the bucket
local data = redis.call('HMGET', key, 'tokens', 'lastRefill')
local tokens = tonumber(data[1])
local lastRefill = tonumber(data[2])

-- First request for this user:
-- start with a full bucket.
if tokens == nil then
    tokens = capacity
    lastRefill = now
end

-- Example:
-- If lastRefill was 10,000 ms and now is 13,000 ms,
-- elapsed = 3,000 ms.
local elapsed = math.max(0, now - lastRefill)

-- refillRate is passed in as tokens per millisecond.
-- Example:
-- 1 token/second becomes 0.001 token/millisecond.
-- So after 3,000 ms, refill = 3.
local refill = elapsed * refillRate

-- Add refilled tokens, but never let the bucket exceed capacity.
tokens = math.min(capacity, tokens + refill)

local allowed = 0
local retryAfterMs = 0

-- A request needs 1 full token.
if tokens >= 1 then
    tokens = tokens - 1
    allowed = 1
else
    -- Example:
    -- If tokens = 0.25 and refillRate = 0.001 token/ms,
    -- we need 0.75 more tokens, so retryAfterMs = 750.
    retryAfterMs = math.ceil((1 - tokens) / refillRate)
end

-- Save the updated bucket back to Redis.
redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', now)

-- Remove inactive buckets automatically after some time.
redis.call('PEXPIRE', key, ttl)

return { allowed, tokens, retryAfterMs }
`;

app.post('/check', async (req, res) => {
    // Each user gets their own bucket.
    const userId = req.body.userId || 'anonymous';
    const key = `rate_limit:token_bucket:${userId}`;

    // We use the current time to figure out how many tokens
    // should have been added back since the last request.
    const now = Date.now();

    // If the user stops sending requests, let Redis delete the bucket later.
    const ttlMs = 60 * 1000;

    // Run the full token bucket logic inside Redis as one atomic operation.
    // We pass:
    // - the Redis key for this user
    // - the bucket capacity
    // - refill rate in tokens per millisecond
    // - current timestamp
    // - key TTL
    const [allowedRaw, tokensRaw, retryAfterMsRaw] = await redis.eval(
        tokenBucketScript,
        1,
        key,
        BUCKET_CAPACITY,
        REFILL_RATE_PER_SECOND / 1000,
        now,
        ttlMs
    );

    // Lua returns numbers, so convert them into normal JS values.
    const allowed = Number(allowedRaw) === 1;
    const tokensLeft = Number(tokensRaw);

    res.status(allowed ? 200 : 429).json({
        strategy: 'token bucket',
        userId,
        allowed,
        capacity: BUCKET_CAPACITY,
        refillRatePerSecond: REFILL_RATE_PER_SECOND,
        // Tokens can be fractional because refill happens continuously over time.
        tokensLeft: Number(tokensLeft.toFixed(2)),
        // If blocked, this tells the client roughly how long to wait
        // until 1 full token becomes available.
        retryAfterMs: Number(retryAfterMsRaw)
    });
});

app.get('/health', (req, res) => {
    res.json({ message: 'Token bucket is running' });
});

app.listen(PORT, () => {
    console.log(`Token bucket server running on port ${PORT}`);
});
