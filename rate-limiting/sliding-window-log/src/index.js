const express = require('express');
const Redis = require('ioredis');

const app = express();
app.use(express.json());

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const PORT = process.env.PORT || 3002;
const WINDOW_SIZE_MS = 60 * 1000;
const MAX_REQUESTS = 5;

redis.on('error', (error) => {
    console.error('Redis connection error:', error.message);
});

app.post('/check', async (req, res) => {
    const userId = req.body.userId || 'anonymous';
    const now = Date.now();
    const windowStart = now - WINDOW_SIZE_MS;
    const key = `rate_limit:sliding_log:${userId}`;
    const member = `${now}-${Math.random().toString(36).slice(2, 8)}`;

    // Remove entries outside the sliding window
    await redis.zremrangebyscore(key, 0, windowStart);
    // Add the current request to the sorted set
    await redis.zadd(key, now, member);
    // Set the expiration for the key to ensure it doesn't persist indefinitely
    await redis.expire(key, Math.ceil(WINDOW_SIZE_MS / 1000));

    const currentCount = await redis.zcard(key);
    const allowed = currentCount <= MAX_REQUESTS;
    const oldestEntry = await redis.zrange(key, 0, 0, 'WITHSCORES');

    let retryAfterSeconds = 0;
    // If the request is not allowed and there is an oldest entry, 
    // calculate the retry-after time
    if (!allowed && oldestEntry.length === 2) {
        const oldestTimestamp = Number(oldestEntry[1]);
        retryAfterSeconds = Math.ceil((oldestTimestamp + WINDOW_SIZE_MS - now) / 1000);
    }

    res.status(allowed ? 200 : 429).json({
        strategy: 'sliding window log',
        userId,
        allowed,
        limit: MAX_REQUESTS,
        currentCount,
        remaining: Math.max(0, MAX_REQUESTS - currentCount),
        retryAfterSeconds: Math.max(0, retryAfterSeconds)
    });
});

app.get('/health', (req, res) => {
    res.json({ message: 'Sliding window log is running' });
});

app.listen(PORT, () => {
    console.log(`Sliding window log server running on port ${PORT}`);
});
