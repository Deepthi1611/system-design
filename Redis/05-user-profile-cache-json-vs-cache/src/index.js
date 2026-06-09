const express = require('express');
const Redis = require('ioredis');

const app = express();
app.use(express.json());

const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

app.post('/user/:id/json', async (req, res) => {
  const userId = req.params.id;
  const userData = req.body;

  try {
    await redisClient.set(`user:${userId}`, JSON.stringify(userData));
    res.status(200).json({ message: 'User profile cached as JSON' });
  } catch (error) {
    console.error('Error caching user profile as JSON:', error);
    res.status(500).json({ error: 'Error caching user profile' });
  }
});

app.get('/user/:id/json', async (req, res) => {
  const userId = req.params.id;

  try {
    const userData = await redisClient.get(`user:${userId}`);
    if (userData) {
      res.status(200).json(JSON.parse(userData));
    } else {
      res.status(404).json({ error: 'User profile not found in cache' });
    }
  } catch (error) {
    console.error('Error retrieving user profile from JSON cache:', error);
    res.status(500).json({ error: 'Error retrieving user profile' });
  }
});

app.post('/user/:id/hash', async (req, res) => {
  const userId = req.params.id;
  const userData = req.body;
  try {
    await redisClient.hset(`user:${userId}`, userData);
    res.status(200).json({ message: 'User profile cached as Hash' });
  } catch (error) {
    console.error('Error caching user profile as Hash:', error);
    res.status(500).json({ error: 'Error caching user profile' });
  }
});

app.get('/user/:id/hash', async (req, res) => {
  const userId = req.params.id;

  try {
    const userData = await redisClient.hgetall(`user:${userId}`);
    if (Object.keys(userData).length > 0) {
      res.status(200).json(userData);
    } else {
      res.status(404).json({ error: 'User profile not found in cache' });
    }
  } catch (error) {
    console.error('Error retrieving user profile from Hash cache:', error);
    res.status(500).json({ error: 'Error retrieving user profile' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
