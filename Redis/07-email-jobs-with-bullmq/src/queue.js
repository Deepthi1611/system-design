import {Queue} from 'bullmq';

// Redis connection configuration because bullmq uses Redis to manage the job queue
export const connection = {
  host: 'localhost',
  port: 6379,
};

// we can declare multiple queues for different purposes, 
// here we are declaring a queue for sending emails
export const emailQueue = new Queue('emailQueue', { connection });

// Dead Letter Queue (DLQ) for permanently failed jobs
// Use a separate queue name that does not contain ':' (bullmq restriction)
export const dlqQueue = new Queue('emailQueue-dlq', { connection });