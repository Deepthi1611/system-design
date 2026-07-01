const express = require('express');
const Redis = require('ioredis');

const app = express();
app.use(express.json());

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const PORT = process.env.PORT || 3005;
// Maximum amount of traffic the bucket can hold at once.
const BUCKET_CAPACITY = 5;
// Water leaks out at a fixed rate of 1 unit per second.
const LEAK_RATE_PER_SECOND = 1;

redis.on('error', (error) => {
    console.error('Redis connection error:', error.message);
});

const leakyBucketScript = `
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local leakRate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local ttl = tonumber(ARGV[4])

-- Read the current bucket state from Redis.
-- waterLevel = how full the bucket is right now
-- lastLeak = when we last recalculated how much water leaked out
local data = redis.call('HMGET', key, 'waterLevel', 'lastLeak')
local waterLevel = tonumber(data[1])
local lastLeak = tonumber(data[2])

-- First request for this user:
-- start with an empty bucket.
if waterLevel == nil then
    waterLevel = 0
    lastLeak = now
end

-- Example:
-- If lastLeak was 10,000 ms and now is 13,000 ms,
-- elapsed = 3,000 ms.
local elapsed = math.max(0, now - lastLeak)

-- leakRate is passed in as units per millisecond.
-- Example:
-- 1 unit/second becomes 0.001 unit/millisecond.
-- So after 3,000 ms, leaked = 3.
local leaked = elapsed * leakRate

-- Remove leaked water, but never go below zero.
waterLevel = math.max(0, waterLevel - leaked)

local allowed = 0
local retryAfterMs = 0

-- Each incoming request adds 1 unit of water.
-- If adding this request would overflow the bucket, block it.
if waterLevel + 1 <= capacity then
    waterLevel = waterLevel + 1
    allowed = 1
else
    -- Example:
    -- If waterLevel = 5, capacity = 5, and leakRate = 0.001 unit/ms,
    -- we need 1 unit to leak out before this request can fit.
    -- retryAfterMs = 1 / 0.001 = 1000 ms.
    retryAfterMs = math.ceil((waterLevel + 1 - capacity) / leakRate)
end

-- Save the updated bucket back to Redis.
redis.call('HMSET', key, 'waterLevel', waterLevel, 'lastLeak', now)

-- Remove inactive buckets automatically after some time.
redis.call('PEXPIRE', key, ttl)

return { allowed, waterLevel, retryAfterMs }
`;

app.post('/check', async (req, res) => {
    // Each user gets their own leaky bucket.
    const userId = req.body.userId || 'anonymous';
    const key = `rate_limit:leaky_bucket:${userId}`;

    // We use the current time to calculate how much water
    // should have leaked since the last request.
    const now = Date.now();

    // If the user stops sending requests, let Redis delete the bucket later.
    const ttlMs = 60 * 1000;

    // Run the full leaky bucket logic inside Redis as one atomic operation.
    // We pass:
    // - the Redis key for this user
    // - the bucket capacity
    // - leak rate in units per millisecond
    // - current timestamp
    // - key TTL
    const [allowedRaw, waterLevelRaw, retryAfterMsRaw] = await redis.eval(
        leakyBucketScript,
        1,
        key,
        BUCKET_CAPACITY,
        LEAK_RATE_PER_SECOND / 1000,
        now,
        ttlMs
    );

    // Lua returns numbers, so convert them into normal JS values.
    const allowed = Number(allowedRaw) === 1;
    const waterLevel = Number(waterLevelRaw);

    res.status(allowed ? 200 : 429).json({
        strategy: 'leaky bucket',
        userId,
        allowed,
        capacity: BUCKET_CAPACITY,
        leakRatePerSecond: LEAK_RATE_PER_SECOND,
        // Water level can be fractional because leaking happens continuously over time.
        waterLevel: Number(waterLevel.toFixed(2)),
        // If blocked, this tells the client roughly how long to wait
        // until enough water leaks out for one more request to fit.
        retryAfterMs: Number(retryAfterMsRaw)
    });
});

app.get('/health', (req, res) => {
    res.json({ message: 'Leaky bucket is running' });
});

app.listen(PORT, () => {
    console.log(`Leaky bucket server running on port ${PORT}`);
});
