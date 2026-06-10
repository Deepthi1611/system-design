const express = require('express');
const redis = require('ioredis');

const app = express();
app.use(express.json());

// publisher instance to publish messages to the 'notifications' channel
const publisher = new redis(process.env.REDIS_URL || 'redis://localhost:6379');

app.post('/notifications', async (req, res) => {
    const payload = {
        title: req.body.title || 'No Title',
        message: req.body.message || 'No Message',
        timestamp: new Date().toISOString()
    }
    // Publish the notification to the 'notifications' channel 
    // and get the number of subscribers that received the message
    const receivers = await publisher.publish('notifications', JSON.stringify(payload));
    res.status(201).json({ receivers });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});