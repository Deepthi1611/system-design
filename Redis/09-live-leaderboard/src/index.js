const express = require('express');
const redis = require('ioredis');

const app = express();
app.use(express.json());

const redisClient = new redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Redis keys
const VIEWS_PREFIX = 'post:';
const LEADERBOARD_KEY = 'leaderboard:scores';
const LOCK_PREFIX = 'lock:';

/**
 * Acquire lock with retry logic
 */
async function acquireLock(key, ttl = 5000, maxRetries = 3) {
  const lockToken = `${Date.now()}-${Math.random()}`;
  for (let i = 0; i < maxRetries; i++) {
    const result = await redisClient.set(key, lockToken, 'PX', ttl, 'NX');
    if (result) return lockToken;
    await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 100));
  }
  throw new Error(`Failed to acquire lock: ${key}`);
}

/**
 * Release lock safely using Lua script
 */
async function releaseLock(key, token) {
  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;
  return await redisClient.eval(script, 1, key, token);
}

/**
 * POST /post/:id/view
 * Increments view count using INCR with locking
 */
app.post('/post/:id/view', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Post ID is required' });
    }

    const lockKey = `${LOCK_PREFIX}post:${id}`;
    const viewKey = `${VIEWS_PREFIX}${id}:views`;
    
    const token = await acquireLock(lockKey);
    
    try {
      // Use transaction to increment and get value
      const pipeline = redisClient.pipeline();
      pipeline.incr(viewKey);
      pipeline.get(viewKey);
      const results = await pipeline.exec();

      if (!results || !results[1]) {
        throw new Error('Failed to increment view count');
      }

      const viewCount = parseInt(results[1][1]);

      res.json({
        success: true,
        postId: id,
        viewCount: viewCount,
        message: 'Post view incremented successfully'
      });
    } finally {
      await releaseLock(lockKey, token);
    }
  } catch (error) {
    console.error('Error incrementing post view:', error);
    res.status(500).json({ error: 'Failed to increment view count', details: error.message });
  }
});

/**
 * POST /leaderboard/score
 * Add points to user's score using ZINCRBY
 */
app.post('/leaderboard/score', async (req, res) => {
  try {
    const { userId, points } = req.body;

    if (!userId || points === undefined) {
      return res.status(400).json({ error: 'userId and points are required' });
    }

    if (typeof points !== 'number' || points <= 0) {
      return res.status(400).json({ error: 'points must be a positive number' });
    }

    // ZINCRBY: increment score in sorted set
    const newScore = await redisClient.zincrby(LEADERBOARD_KEY, points, userId);
    const rank = await redisClient.zrevrank(LEADERBOARD_KEY, userId);

    res.json({
      success: true,
      userId: userId,
      pointsAdded: points,
      totalScore: parseInt(newScore),
      rank: rank + 1, // Convert 0-indexed to 1-indexed
      message: 'Score updated successfully'
    });
  } catch (error) {
    console.error('Error adding score:', error);
    res.status(500).json({ error: 'Failed to add score', details: error.message });
  }
});

/**
 * GET /leaderboard
 * Get top 10 leaders using ZREVRANGE
 */
app.get('/leaderboard', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);

    // ZREVRANGE: get top scores in descending order
    const results = await redisClient.zrevrange(LEADERBOARD_KEY, 0, limit - 1, 'WITHSCORES');
    // results is an array like [userId1, score1, userId2, score2, ...]

    const leaders = [];
    for (let i = 0; i < results.length; i += 2) {
      leaders.push({
        rank: leaders.length + 1,
        userId: results[i],
        score: parseInt(results[i + 1])
      });
    }

    res.json({
      success: true,
      limit: limit,
      leaders: leaders,
      message: `Retrieved top ${leaders.length} leaders`
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard', details: error.message });
  }
});

/**
 * GET /leaderboard/:userId/rank
 * Get rank of a particular user using ZREVRANK
 */
app.get('/leaderboard/:userId/rank', async (req, res) => {
  try {
    const { userId } = req.params;

    // ZREVRANK: get rank (0-indexed)
    const rank = await redisClient.zrevrank(LEADERBOARD_KEY, userId);

    if (rank === null) {
      return res.status(404).json({
        success: false,
        error: 'User not found in leaderboard'
      });
    }

    const score = await redisClient.zscore(LEADERBOARD_KEY, userId);

    res.json({
      success: true,
      userId: userId,
      rank: rank + 1, // Convert 0-indexed to 1-indexed
      score: parseInt(score),
      message: 'User rank retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching user rank:', error);
    res.status(500).json({ error: 'Failed to fetch user rank', details: error.message });
  }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Live Leaderboard API is running'
  });
});

app.listen(3000, () => {
  console.log('Live Leaderboard API running on port 3000');
  console.log(`
Available Endpoints:
  POST   /post/:id/view              - Increment post view count (uses INCR with locking)
  POST   /leaderboard/score          - Add points to user score (uses ZINCRBY)
  GET    /leaderboard                - Get top 10 leaders (uses ZREVRANGE)
  GET    /leaderboard/:userId/rank   - Get user rank (uses ZREVRANK)
  GET    /health                     - Health check
  `);
});

module.exports = app;
