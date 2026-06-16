import { emailQueue } from './queue.js';

/**
 * Schedule a repeatable job using a cron expression.
 * @param {string} email
 * @param {string} cronExpression - cron string, e.g. '5 * * * *' (every 5 minutes)
 */
export async function scheduleEmailCron(email, cronExpression = '*/1 * * * *') {
  return await emailQueue.add(
    'scheduledEmail',
    {
      email,
      subject: 'Scheduled Email',
      body: 'This email is sent on a schedule.'
    },
    {
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
