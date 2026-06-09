const express = require('express');
import { emailQueue } from './queue.js';

const app = express();
app.use(express.json());

// producer
// add function takes three parameters: the name of the job, 
// the data to be processed, and options for the job
app.post('/welcome-email', async (req, res) => { 
    const job = emailQueue.add('sendWelcomeEmail', {
        email: req.body.email,
        subject: 'Welcome to our service!',
        body: 'Thank you for signing up for our service. We are excited to have you on board!'
    },
    {
        attempts: 3, // number of retry attempts if the job fails
        backoff: {
            type: 'exponential', // type of backoff strategy
            delay: 5000, // initial delay in milliseconds before retrying
        },
    }
    );
    res.status(200).json({ message: 'Welcome email job added to the queue' });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});