// consumer
import { Worker } from 'bullmq';
import { connection, dlqQueue } from './queue.js';

// Worker processes jobs from the emailQueue
// It takes three parameters: the name of the queue, 
// a processor function that defines how to handle each job, 
// and the Redis connection configuration
const emailWorker = new Worker(
    'emailQueue',
    async (job) => {
        // Simulate sending an email by logging the job data
        console.log(`Processing job ${job.id} of type ${job.name}, 
        {data: ${JSON.stringify(job.data)}}`);
        console.log(`Sending email to ${job.data.email} with subject: ${job.data.subject} with body: ${job.data.body}`);
        // Simulate a delay to mimic email sending time
        await new Promise((resolve) => setTimeout(resolve, 2000));
        console.log(`Email sent to ${job.data.email}`);
    },
    { connection }
)

emailWorker.on('completed', (job) => {
    console.log(`Job ${job.id} completed successfully.`);
});

emailWorker.on('failed', async (job, err) => {
    console.error(`Job ${job.id} failed with error: ${err.message}`);

    // If the job had a configured number of attempts and all attempts
    // have been exhausted, move a record of the job into the DLQ for
    // inspection or manual replay.
    try {
        const maxAttempts = job.opts && job.opts.attempts ? job.opts.attempts : 0;
        if (maxAttempts > 0 && job.attemptsMade >= maxAttempts) {
                // include replay metadata to avoid infinite replay loops
                const dlqPayload = {
                    originalJobId: job.id,
                    originalName: job.name,
                    originalData: job.data,
                    failedReason: err && err.message ? err.message : String(err),
                    attemptsMade: job.attemptsMade,
                    failedAt: Date.now(),
                    // how many times this DLQ entry has been replayed
                    replayCount: 0,
                    // maximum automatic/manual replays allowed for this entry
                    maxReplays: (job.opts && job.opts.maxReplays) ? job.opts.maxReplays : 3,
                    // whether this item is considered poisoned (should not be replayed automatically)
                    poisoned: false,
                };

                await dlqQueue.add('failedJob', dlqPayload);
                console.log(`Moved job ${job.id} to DLQ as failedJob (maxReplays=${dlqPayload.maxReplays})`);
        }
    } catch (e) {
        console.error('Error moving job to DLQ:', e);
    }
});