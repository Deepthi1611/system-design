const express = require('express');
const Redis = require('ioredis');

const app = express();
app.use(express.json());

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const PORT = process.env.PORT || 3003;
const WINDOW_SIZE_SECONDS = 60;
const MAX_REQUESTS = 5;

redis.on('error', (error) => {
    console.error('Redis connection error:', error.message);
});

function getWindowStart(timestampMs) {
    // Example with a 60-second window:
    // If now is 12:01:25, this rounds down to the start of that window: 12:01:00.
    return Math.floor(timestampMs / (WINDOW_SIZE_SECONDS * 1000)) * WINDOW_SIZE_SECONDS;
}

app.post('/check', async (req, res) => {
    const userId = req.body.userId || 'anonymous';
    const now = Date.now();

    // We split time into fixed buckets.
    // Example:
    // - now = 12:01:25
    // - current window = 12:01:00 to 12:01:59
    // - previous window = 12:00:00 to 12:00:59
    const currentWindowStart = getWindowStart(now);
    const previousWindowStart = currentWindowStart - WINDOW_SIZE_SECONDS;

    // How many seconds have passed since the current window started?
    // Example:
    // - now = 12:01:15
    // - currentWindowStart = 12:01:00
    // - elapsedInWindow = 15
    const elapsedInWindow = Math.floor(now / 1000) - currentWindowStart;

    // This decides how much of the previous window should still count.
    // Example with a 60-second window at 12:01:15:
    // - the last 60 seconds are 12:00:15 to 12:01:15
    // - 45 seconds come from the previous window
    // - so previousWindowWeight = 45 / 60 = 0.75
    const previousWindowWeight = (WINDOW_SIZE_SECONDS - elapsedInWindow) / WINDOW_SIZE_SECONDS;

    const currentKey = `rate_limit:sliding_counter:${userId}:${currentWindowStart}`;
    const previousKey = `rate_limit:sliding_counter:${userId}:${previousWindowStart}`;

    const [currentCountRaw, previousCountRaw] = await redis.mget(currentKey, previousKey);
    const currentCount = Number(currentCountRaw || 0);
    const previousCount = Number(previousCountRaw || 0);

    // Sliding window counter does not store every request timestamp.
    // Instead, it estimates the load in the current sliding window by:
    // - taking all requests from the current bucket
    // - taking only a weighted part of the previous bucket
    //
    // Example:
    // - currentCount = 2
    // - previousCount = 4
    // - previousWindowWeight = 0.75
    // estimatedCount = 2 + (4 * 0.75) = 5
    const estimatedCount = currentCount + previousCount * previousWindowWeight;

    // We are about to process one more request, so check whether adding 1
    // would cross the rate limit.
    const allowed = estimatedCount + 1 <= MAX_REQUESTS;

    let updatedCurrentCount = currentCount;
    if (allowed) {
        updatedCurrentCount = await redis.incr(currentKey);

        // Keep the current bucket long enough so that on the next window
        // it can still be read as the "previous" bucket.
        await redis.expire(currentKey, WINDOW_SIZE_SECONDS * 2);
    }

    res.status(allowed ? 200 : 429).json({
        strategy: 'sliding window counter',
        userId,
        allowed,
        limit: MAX_REQUESTS,
        currentWindowCount: updatedCurrentCount,
        previousWindowCount: previousCount,
        estimatedCount: Number((allowed ? estimatedCount + 1 : estimatedCount).toFixed(2)),
        remaining: Math.max(0, Math.floor(MAX_REQUESTS - (allowed ? estimatedCount + 1 : estimatedCount)))
    });
});

app.get('/health', (req, res) => {
    res.json({ message: 'Sliding window counter is running' });
});

app.listen(PORT, () => {
    console.log(`Sliding window counter server running on port ${PORT}`);
});
