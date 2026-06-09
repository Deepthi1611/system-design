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