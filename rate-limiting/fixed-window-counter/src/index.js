const express = require('express');
const Redis = require('ioredis');

const app = express();
app.use(express.json());

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const PORT = process.env.PORT || 3001;
const WINDOW_SIZE_SECONDS = 60;
const MAX_REQUESTS = 5;

redis.on('error', (error) => {
    console.error('Redis connection error:', error.message);
});

function getWindowStart(timestampMs) {
    return Math.floor(timestampMs / (WINDOW_SIZE_SECONDS * 1000)) * WINDOW_SIZE_SECONDS;
}

app.post('/check', async (req, res) => {
    const userId = req.body.userId || 'anonymous';
    const now = Date.now();
    const windowStart = getWindowStart(now);
    const key = `rate_limit:fixed_window:${userId}:${windowStart}`;

    const currentCount = await redis.incr(key);

    if (currentCount === 1) {
        await redis.expire(key, WINDOW_SIZE_SECONDS);
    }

    const ttl = await redis.ttl(key);
    const allowed = currentCount <= MAX_REQUESTS;

    res.status(allowed ? 200 : 429).json({
        strategy: 'fixed window counter',
        userId,
        allowed,
        limit: MAX_REQUESTS,
        currentCount,
        remaining: Math.max(0, MAX_REQUESTS - currentCount),
        retryAfterSeconds: ttl > 0 ? ttl : WINDOW_SIZE_SECONDS
    });
});

app.get('/health', (req, res) => {
    res.json({ message: 'Fixed window counter is running' });
});

app.listen(PORT, () => {
    console.log(`Fixed window counter server running on port ${PORT}`);
});
