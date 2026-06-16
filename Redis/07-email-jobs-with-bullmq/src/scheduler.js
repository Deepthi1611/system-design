import { emailQueue } from './queue.js';

/**
 * Build a deterministic repeatable job ID.
 * This prevents duplicate repeatable jobs when the server restarts.
 */
function buildScheduleJobId(email, cronExpression) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedCron = String(cronExpression).trim();
  return `scheduledEmail:${normalizedEmail}:${normalizedCron}`;
}

/**
 * Schedule a repeatable job using a cron expression.
 * If the same schedule already exists, it will not be added again.
 * @param {string} email
 * @param {string} cronExpression - cron string, e.g. '5 * * * *' (every 5 minutes)
 */
export async function scheduleEmailCron(email, cronExpression = '*/1 * * * *') {
  const jobId = buildScheduleJobId(email, cronExpression);
  const repeatableJobs = await emailQueue.getRepeatableJobs();
  const exists = repeatableJobs.some(
    (job) => job.id === jobId && job.name === 'scheduledEmail'
  );

  if (exists) {
    return null;
  }

  return await emailQueue.add(
    'scheduledEmail',
    {
      email,
      subject: 'Scheduled Email',
      body: 'This email is sent on a schedule.'
    },
    {
      jobId,
      repeat: { cron: cronExpression },
    }
  );
}

/**
 * Remove a repeatable job by its name and repeat options.
 * @param {string} name
 * @param {object} repeatOpts - e.g. { cron: '5 * * * *' }
 */
export async function removeRepeatable(name = 'scheduledEmail', repeatOpts = { cron: '*/1 * * * *' }) {
  await emailQueue.removeRepeatable(name, repeatOpts);
}
