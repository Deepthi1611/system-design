# BullMQ Email Queue Demo

## Overview

This project demonstrates how to use BullMQ with Redis to implement asynchronous background job processing.

Instead of sending emails directly inside the API request-response cycle, email jobs are added to a queue and processed by a worker in the background.

This approach improves:

* API response time
* Scalability
* Reliability
* Fault tolerance
* Separation of concerns

---

# Why Use a Queue?

Consider a user signup flow:

Without a queue:

```text
Client
  ↓
API
  ↓
Create User
  ↓
Send Email
  ↓
Response
```

The user waits until the email is sent.

---

With BullMQ:

```text
Client
  ↓
API
  ↓
Create Job
  ↓
Redis Queue
  ↓
Response
```

The worker processes the email later:

```text
Redis Queue
  ↓
Worker
  ↓
Send Email
```

The API responds immediately while the email is sent asynchronously.

---

# Architecture

```text
Producer (Express API)
        │
        │ add()
        ▼
┌─────────────────┐
│   Redis Queue   │
│   emailQueue    │
└─────────────────┘
        │
        │
        ▼
Worker (BullMQ)
        │
        ▼
Email Service
```

---

# Project Structure

```text
.
├── api.js
├── queue.js
└── worker.js
```

---

# queue.js

Responsible for:

* Creating Redis connection configuration
* Creating BullMQ queues

```js
export const connection = {
  host: 'localhost',
  port: 6379,
};
```

This tells BullMQ where Redis is running.

---

## Queue Creation

```js
export const emailQueue = new Queue(
  'emailQueue',
  { connection }
);
```

Queue Name:

```text
emailQueue
```

BullMQ stores jobs for this queue in Redis.

---

# api.js (Producer)

The API acts as a Producer.

A producer is responsible for creating jobs and placing them into the queue.

---

## Endpoint

```http
POST /welcome-email
```

Request:

```json
{
  "email": "user@example.com"
}
```

---

## Adding a Job

```js
emailQueue.add(
  'sendWelcomeEmail',
  data,
  options
);
```

---

### Parameter 1: Job Name

```js
'sendWelcomeEmail'
```

The logical type of job.

Examples:

```text
sendWelcomeEmail
sendPasswordResetEmail
generateReport
processPayment
```

---

### Parameter 2: Job Data

```js
{
  email,
  subject,
  body
}
```

Payload required by the worker.

BullMQ serializes this data and stores it in Redis.

---

### Parameter 3: Job Options

```js
{
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000
  }
}
```

---

# Retries

```js
attempts: 3
```

If the job fails:

```text
Attempt 1
Attempt 2
Attempt 3
```

After all attempts fail:

```text
Job marked as failed
```

---

# Backoff Strategy

Backoff controls the delay between retries.

Current configuration:

```js
{
  type: 'exponential',
  delay: 5000
}
```

Retry schedule:

```text
Attempt 1 → Fail

Wait 5 seconds

Attempt 2 → Fail

Wait 10 seconds

Attempt 3 → Fail

Wait 20 seconds
```

This prevents immediate retry storms.

---

# worker.js (Consumer)

The Worker acts as a Consumer.

A consumer retrieves jobs from Redis and executes them.

---

## Worker Creation

```js
const emailWorker = new Worker(
  'emailQueue',
  processor,
  { connection }
);
```

---

### Queue Name

```js
'emailQueue'
```

Must match the queue name used by the producer.

---

### Processor Function

```js
async (job) => {}
```

Defines how jobs are executed.

---

## Job Object

BullMQ provides a job object.

Common properties:

```js
job.id
job.name
job.data
job.attemptsMade
job.timestamp
```

Example:

```js
console.log(job.id);
console.log(job.data.email);
```

---

# Job Lifecycle

```text
Waiting
   ↓
Active
   ↓
Completed
```

or

```text
Waiting
   ↓
Active
   ↓
Failed
```

---

# Worker Events

## Completed Event

```js
emailWorker.on(
  'completed',
  (job) => {}
);
```

Triggered when:

```text
Job processed successfully
```

---

## Failed Event

```js
emailWorker.on(
  'failed',
  (job, err) => {}
);
```

Triggered when:

```text
Job execution throws an error
```

after retries are exhausted.

---

## Scheduling / Repeatable Jobs

Scheduled (repeatable) jobs run automatically on a recurring schedule (cron or fixed interval). Use cases: daily reports, periodic notifications, cleanup jobs.

How it works in this project:

- Create a repeatable job by adding a job with the `repeat` option. Example:

```js
emailQueue.add('scheduledEmail', data, { repeat: { cron: '0 9 * * *' } });
```

- BullMQ persists repeat metadata in Redis and will create jobs according to the schedule.
- A scheduler (QueueScheduler or JobScheduler depending on your BullMQ version) should be running so repeatable jobs are restored and executed reliably across restarts.

Helpers added:

- `src/scheduler.js` exposes `scheduleEmailCron(email, cronExpression)` and `removeRepeatable(name, repeatOpts)` helpers.

Node example (schedule every minute):

```js
import { scheduleEmailCron, removeRepeatable } from './src/scheduler.js';

// schedule to run every minute
await scheduleEmailCron('user@example.com', '*/1 * * * *');

// remove later
await removeRepeatable('scheduledEmail', { cron: '*/1 * * * *' });
```

Notes:

- Ensure your scheduler process is running when relying on repeatable jobs; otherwise scheduled runs may be missed if workers restart.
- Make scheduled handlers idempotent to handle duplicates.

Using `scheduler.js`

- `src/scheduler.js` is a helper that creates repeatable jobs on BullMQ with a deterministic job ID. This prevents duplicate repeatable entries if the server restarts and the schedule initialization code runs again.
- The helper checks existing repeatable jobs first, and only adds the schedule if it does not already exist.
- Two common integration patterns:
  1. Start schedules at app startup (good for fixed schedules): import and call `scheduleEmailCron()` during initialization of your API/worker process.
  2. Expose admin endpoints that call `scheduleEmailCron()` / `removeRepeatable()` so operators can add/remove schedules at runtime.

Example: ensure a QueueScheduler is running (required for reliable repeatable/delayed processing)

```js
// in your worker or startup file
import { QueueScheduler } from 'bullmq';
import { connection } from './queue.js';

new QueueScheduler('emailQueue', { connection });
```

Example: schedule at startup

```js
import { scheduleEmailCron } from './src/scheduler.js';

(async () => {
  // schedule to run every day at 09:00
  await scheduleEmailCron('ops@example.com', '0 9 * * *');
})();
```

Example: admin endpoints (optional)

```js
// POST /schedule { email, cron }
app.post('/schedule', async (req, res) => {
  await scheduleEmailCron(req.body.email, req.body.cron);
  res.json({ message: 'Scheduled' });
});

// DELETE /schedule { name, cron }
app.delete('/schedule', async (req, res) => {
  await removeRepeatable(req.body.name || 'scheduledEmail', { cron: req.body.cron });
  res.json({ message: 'Removed' });
});
```

File: [src/scheduler.js](src/scheduler.js#L1)

### Cron vs BullMQ scheduling — Differences and guidance

- **Scope & trigger**: System `cron` (or an external scheduler) triggers commands or makes HTTP calls at scheduled times. BullMQ scheduling keeps the schedule inside the queue system and enqueues jobs from Redis according to the `repeat` metadata.
- **Mechanism**: Cron is an OS/service-level scheduler. BullMQ uses `queue.add(..., { repeat: { cron: '...' }})` or `repeat: { every: ms }` and a scheduler process (QueueScheduler/JobScheduler) to create occurrences.
- **Persistence & recovery**: BullMQ persists repeat metadata in Redis so schedules survive app restarts and leader changes. System cron persists in system/cluster configuration and is independent of your app's runtime state.
- **Scaling & distribution**: BullMQ schedules produce jobs that are consumed by distributed workers (easy horizontal scaling). With cron in multi-instance deployments you must coordinate (leader election or centralized cron) to avoid duplicate triggers.
- **Retries, backoff & DLQ**: BullMQ natively supports `attempts`, `backoff`, and patterns for handling permanently failed runs (DLQ). Cron-triggered tasks need to handle retries and failure tracking externally or push work into BullMQ for those features.
- **Observability**: BullMQ exposes job state and history via its API (inspect repeatable jobs, failures, attempts). Cron relies on system logs or separate monitoring integrations.
- **Timezones & advanced calendar rules**: Some cron systems or orchestration tools provide richer calendar semantics and timezone features; BullMQ supports cron strings (and may support `tz` depending on version) but is not a full calendar engine.

When to use which:
- **Use BullMQ scheduling** when the scheduled work belongs in your job-processing pipeline and you want built-in retries, persistence, DLQ, and easy worker scaling.
- **Use system cron / external schedulers** when you need external orchestration across multiple services, advanced calendar features, or you want a lightweight trigger that calls an endpoint or pushes a job into a queue.
- **Hybrid approach**: run cron (or a cloud scheduler) to POST to an API that enqueues a BullMQ job — this keeps orchestration outside the app but still benefits from BullMQ's processing, retries, and observability.



## Delayed Jobs

Delayed jobs are jobs that are scheduled to become active after a specified delay. They are useful for
notifications, reminders, or any work that should happen in the future rather than immediately.

Implementation details in this project:

- The producer uses the `delay` option when adding a job to the queue. Example (API endpoint):

  POST `/welcome-email-delayed` with JSON body:

  ```json
  { "email": "user@example.com", "delayMs": 60000 }
  ```

- The API handler calls `emailQueue.add(name, data, { delay: delayMs, attempts, backoff })`.
- BullMQ stores the job in Redis and makes it visible to workers only after the delay has elapsed.
- The worker processes the job the same way as immediate jobs; no special worker code is required.

Example curl to schedule a delayed job:

```bash
curl -X POST http://localhost:3000/welcome-email-delayed \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","delayMs":60000}'
```

Notes:

- Ensure a scheduler (QueueScheduler or JobScheduler) is running when relying on delayed/repeatable jobs; otherwise delays may not be processed reliably if the worker restarts.
- Replace the demo worker's simulated send logic with your real email-sending integration.


## Dead Letter Queue (DLQ)

A Dead Letter Queue (DLQ) is a separate queue that stores jobs which have permanently failed after exhausting their retry attempts. DLQs let you inspect, triage, and optionally replay failed work without losing the original payload or error context.

Why use a DLQ?

- Inspect permanently failed items for debugging or manual intervention.
- Replay items after fixing transient issues (e.g., a flaky external API).
- Keep failed traffic separate from the main queue to reduce noise and simplify monitoring.

How it's implemented in this demo:

- `src/queue.js` exports a second queue named `emailQueue-dlq` for storing failed jobs.
- The worker (`src/worker.js`) listens to the `failed` event. When a job has exhausted its configured attempts (e.g. `attempts: 3`), the worker writes a small record into the DLQ containing the original job name, data, failure reason and metadata.
- The API exposes endpoints to list DLQ entries and to replay a DLQ entry back into the main `emailQueue`.


Replay policy and operator workflow

- DLQ entries include `replayCount`, `maxReplays`, and a `poisoned` flag. When a job is moved to the DLQ the demo sets `replayCount: 0` and `maxReplays` (default 3).
- The `POST /dlq/replay/:id` endpoint enforces the replay policy:
  - If `replayCount >= maxReplays` the API returns `400` unless you pass `?force=true` or `{ "force": true }` in the body.
  - When replaying, the endpoint increments `replayCount`, sets `lastReplayedAt`, and marks the entry `poisoned` when the limit is reached. By default the DLQ record is kept for audit; `?force=true` will remove it after replay.

Why this design?

- Prevent infinite DLQ ↔ main-queue loops: each replay increments `replayCount` and entries are prevented from being replayed beyond `maxReplays` without explicit operator override.
- Keep failed records for audit: DLQ entries are preserved by default so you can inspect payloads and failure reasons before deciding to replay.
- Operator control: manual replay gives operators the chance to fix external issues (credentials, API outages, bad data) before retrying.

Typical operator flow

1. Inspect DLQ entries:

```bash
curl http://localhost:3000/dlq
```

2. Decide to replay an entry (if `replayCount < maxReplays`):

```bash
curl -X POST http://localhost:3000/dlq/replay/<dlqId>
```

3. If you need to force removal and replay despite reaching the limit:

```bash
curl -X POST 'http://localhost:3000/dlq/replay/<dlqId>?force=true' -H 'Content-Type: application/json' -d '{"attempts":3}'
```

4. If a particular entry is clearly corrupted or should never be retried, mark it `poisoned` (the API marks entries poisoned when `maxReplays` is reached). You can also manually remove the entry using the BullMQ UI or `job.remove()`.

Notes and recommendations:

- Always make processors idempotent or add deduplication to avoid duplicate side-effects when replaying.
- Consider exporting DLQ records to a searchable store (database or logging system) for richer investigation and retention.
- If you want automated replay policies in production, implement a controlled DLQ worker that reads DLQ entries and re-enqueues them according to strict limits and backoff. This demo purposefully leaves replay as an operator-driven action by default.

DLQ API examples:

- List DLQ entries (first 100):

```bash
curl http://localhost:3000/dlq
```

- Replay a DLQ entry back to the main queue (replace `<dlqJobId>`):

```bash
curl -X POST http://localhost:3000/dlq/replay/<dlqJobId> \
  -H 'Content-Type: application/json' \
  -d '{"attempts":3}'
```

Notes and recommendations:

- The DLQ job contains the original payload under `originalData` and `originalName`, plus `failedReason` and `attemptsMade`.
- When replaying a job, the demo re-adds the original payload into `emailQueue` and removes the DLQ entry. You may prefer to keep DLQ entries for audit — adapt to your needs.
- Make replay idempotent or add safeguards to prevent duplicate side-effects when reprocessing.


# What Happens Internally?

When:

```http
POST /welcome-email
```

is called:

---

Step 1

Producer creates job.

```text
sendWelcomeEmail
```

---

Step 2

BullMQ stores job metadata in Redis.

```text
emailQueue
```

---

Step 3

Worker polls Redis.

---

Step 4

Worker claims job.

```text
Waiting
  ↓
Active
```

---

Step 5

Processor function executes.

---

Step 6

Job is marked:

```text
Completed
```

or

```text
Failed
```

---

# Why BullMQ Instead of Redis Lists?

Redis Lists provide basic queues.

Example:

```text
LPUSH
RPOP
```

BullMQ builds on Redis and provides:

* Retries
* Backoff
* Delayed jobs
* Concurrency
* Job state tracking
* Priority queues
* Repeatable jobs
* Rate limiting
* Dead-letter style workflows

without implementing them manually.

---

# Redis Data Structures Used by BullMQ

BullMQ internally uses:

* Lists
* Sorted Sets
* Hashes
* Streams (depending on version/features)

to track job states.

You interact with BullMQ APIs instead of managing these structures yourself.

---

# Improvements

## 1. Await Job Creation

Current code:

```js
const job = emailQueue.add(...)
```

should be:

```js
const job = await emailQueue.add(...)
```

Reason:

```text
Ensures job is actually stored
before sending success response.
```

---

## 2. Add Input Validation

Validate:

```js
email
subject
body
```

before creating jobs.

Example:

```js
if (!req.body.email) {
  return res.status(400).json({
    error: 'Email required'
  });
}
```

---

## 3. Separate Email Service

Current worker:

```js
console.log(...)
```

Create:

```text
services/
  email.service.js
```

Worker should only orchestrate execution.

---

## 4. Configure Concurrency

Current worker processes:

```text
1 job at a time
```

Production example:

```js
new Worker(
  'emailQueue',
  processor,
  {
    connection,
    concurrency: 10
  }
)
```

Allows multiple jobs simultaneously.

---

## 5. Add Queue Events

Use:

```js
QueueEvents
```

to monitor:

* completed
* failed
* stalled
* delayed

jobs.

---

## 6. Add Dead Letter Queue

Move permanently failed jobs into:

```text
failedEmailQueue
```

for inspection and replay.

---

## 7. Graceful Shutdown

Handle:

```js
SIGINT
SIGTERM
```

and close worker connections cleanly.

---

## 8. Use Environment Variables

Instead of:

```js
host: 'localhost'
port: 6379
```

use:

```js
host: process.env.REDIS_HOST
port: process.env.REDIS_PORT
```

for production readiness.

---

# Key Concepts Learned

* Producer creates jobs.
* Queue stores jobs.
* Redis acts as the backing store.
* Worker consumes jobs.
* BullMQ manages retries and failures.
* Backoff prevents retry storms.
* Background processing improves API responsiveness.
* Workers can scale independently of APIs.
* BullMQ provides a production-ready abstraction over Redis queues.