const express = require('express');
const Redis = require('ioredis');
const mongoose = require('mongoose');

const app = express();

// create a redis client
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

redis.on('error', (error) => {
    console.error('Redis connection error:', error.message);
});

// Test Redis connection
app.get('/redis', async (req, res) => {
    try {
        const reply = await redis.ping();
        res.json({ message: `Redis replied: ${reply}` });
    } catch (error) {
        res.status(500).json({
            message: 'Unable to connect to Redis',
            error: error.message,
        });
    }
});

app.get('/mongoose', async (req, res) => {
    try {
        const url = process.env.MONGODB_URL || 'mongodb://localhost:27017/redis_demo';
        if(mongoose.connection.readyState === 0) {
            await mongoose.connect(url);
        }
        res.json({ message: 'Mongoose connected successfully', database: mongoose.connection.name });
    } catch (error) {
        res.status(500).json({
            message: 'Unable to connect to MongoDB',
            error: error.message,
        });
    }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
