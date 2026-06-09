// consumer
import { Worker } from 'bullmq';
import { connection } from './queue.js';

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

emailWorker.on('failed', (job, err) => {
    console.error(`Job ${job.id} failed with error: ${err.message}`);
});