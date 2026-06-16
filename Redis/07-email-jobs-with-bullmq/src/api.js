const express = require('express');
import { emailQueue, dlqQueue } from './queue.js';

const app = express();
app.use(express.json());

// producer
// add function takes three parameters: the name of the job, 
// the data to be processed, and options for the job
app.post('/welcome-email', async (req, res) => { 
    const job = await emailQueue.add('sendWelcomeEmail', {
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
    res.status(200).json({ message: 'Welcome email job added to the queue', jobId: job.id });
});

// Delayed job endpoint
// Example: POST /welcome-email-delayed with JSON { "email":"a@b.com", "delayMs": 60000 }
app.post('/welcome-email-delayed', async (req, res) => {
    const delayMs = Number(req.body.delayMs) || 60000; // default 60s
        const delayedJob = await emailQueue.add('sendWelcomeEmailDelayed', {
        email: req.body.email,
        subject: 'Welcome (delayed)',
        body: 'This is a delayed welcome email.'
    }, {
        delay: delayMs,
        attempts: 3,
        backoff: { type: 'fixed', delay: 3000 }
    });

        res.status(200).json({ message: `Delayed welcome email scheduled in ${delayMs}ms`, jobId: delayedJob.id });
});


// DLQ endpoints
// List jobs currently in the DLQ (first 100)
app.get('/dlq', async (req, res) => {
    try {
        const jobs = await dlqQueue.getJobs(['waiting','active','delayed','completed','failed'], 0, 99);
        const mapped = jobs.map(j => ({ id: j.id, name: j.name, data: j.data, timestamp: j.timestamp }));
        res.json(mapped);
    } catch (e) {
        res.status(500).json({ error: String(e) });
    }
});

// Replay a DLQ job back to the main queue and remove it from the DLQ
app.post('/dlq/replay/:id', async (req, res) => {
    const id = req.params.id;
    const force = req.query.force === 'true' || req.body.force === true;
    try {
        const job = await dlqQueue.getJob(id);
        if (!job) return res.status(404).json({ error: 'DLQ job not found' });

        const payload = job.data || {};
        const originalName = payload.originalName || 'replayedJob';
        const originalData = payload.originalData || payload;

        // Guard against infinite replay loops using replayCount and maxReplays
        const replayCount = typeof payload.replayCount === 'number' ? payload.replayCount : 0;
        const maxReplays = typeof payload.maxReplays === 'number' ? payload.maxReplays : 3;

        if (!force && replayCount >= maxReplays) {
            return res.status(400).json({ error: 'Replay limit reached for this DLQ entry', replayCount, maxReplays });
        }

        // Increment replayCount and update DLQ record for audit
        const newPayload = Object.assign({}, payload, {
            replayCount: replayCount + 1,
            lastReplayedAt: Date.now()
        });

        // Re-add the job to the main queue
        await emailQueue.add(originalName, originalData, { attempts: req.body.attempts || 3 });

        // Update DLQ record with new replayCount and mark poisoned if limit reached
        if (replayCount + 1 >= maxReplays) {
            newPayload.poisoned = true;
        }
        try {
            await job.update(newPayload);
        } catch (e) {
            // job.update may fail on some versions; log and continue
            console.error('Failed to update DLQ job payload:', e);
        }

        // By default keep DLQ record for audit. If force=true, remove it after replay.
        if (force) {
            try { await job.remove(); } catch (e) { console.error('Failed to remove DLQ job:', e); }
        }

        res.json({ message: 'Replayed job to main queue', id, replayCount: newPayload.replayCount, poisoned: newPayload.poisoned || false });
    } catch (e) {
        res.status(500).json({ error: String(e) });
    }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});