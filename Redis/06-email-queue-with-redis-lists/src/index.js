const express = require('express');
const redis = require('ioredis');

const app = express();
app.use(express.json());

const redisClient = new redis(process.env.REDIS_URL || 'redis://localhost:6379');

const QUEUE_NAME = 'queue:emails';

app.post('/send-email', async (req, res) => {
  const job = {
    to: req.body.to,
    subject: req.body.subject,
    body: req.body.body,
    createdAt: new Date().toISOString(),
  }

  try {
    await redisClient.lpush(QUEUE_NAME, JSON.stringify(job));
    res.status(200).json({ message: 'Email added to the queue' });
  } catch (error) {
    console.error('Error adding email to queue:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/emails/process-one', async (req, res) => {
    try {
        const jobData = await redisClient.rpop(QUEUE_NAME);
        if (!jobData) {
            return res.status(200).json({ message: 'No emails to process' });
        }

        const job = JSON.parse(jobData);
        // Simulate email sending
        console.log(`Sending email to: ${job.to}, subject: ${job.subject}`);
        
        res.status(200).json({ message: 'Email processed', job });
    } catch (error) {
        console.error('Error processing email:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/emails/queue-length', async (req, res) => {
    try {
        const length = await redisClient.llen(QUEUE_NAME);
        res.status(200).json({ queueLength: length });
    } catch (error) {
        console.error('Error getting queue length:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(3000, () => {
  console.log('Email queue server is running on port 3000');
});