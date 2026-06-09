# Redis Lists as a Message Queue

## Overview

This project demonstrates how Redis Lists can be used as a simple message queue for asynchronous background processing.

Instead of sending emails directly within the request-response cycle, email jobs are added to a Redis queue and processed later by a worker.

This pattern helps:

* Reduce API response times
* Decouple email processing from business logic
* Improve scalability
* Handle background tasks asynchronously

---

# Architecture

```text
Client
   │
   ▼
POST /send-email
   │
   ▼
Producer
(Express API)
   │
LPUSH
   │
   ▼
Redis List (queue:emails)
   │
RPOP
   │
   ▼
Consumer / Worker
   │
   ▼
Send Email
```

---

# Redis List

A Redis List is an ordered collection of elements.

Example:

```text
queue:emails

[
  Job3,
  Job2,
  Job1
]
```

Redis Lists are commonly used to implement:

* Queues
* Task processing systems
* Job scheduling systems
* Background workers

---

# Queue Terminology

## Producer

A producer creates jobs and pushes them into the queue.

In this project:

```js
POST /send-email
```

acts as the producer.

Example job:

```json
{
  "to": "user@example.com",
  "subject": "Welcome",
  "body": "Hello",
  "createdAt": "2025-01-01T10:00:00Z"
}
```

---

## Consumer

A consumer (worker) removes jobs from the queue and processes them.

In this project:

```js
GET /emails/process-one
```

acts as the consumer.

---

## Job

A job is a unit of work.

Example:

```json
{
  "to": "user@example.com",
  "subject": "Welcome",
  "body": "Hello"
}
```

Sending an email is the job.

---

## Queue

A queue is a data structure that stores jobs waiting to be processed.

Queue name:

```js
queue:emails
```

---

# Redis Commands Used

## LPUSH

Adds an element to the left side of the list.

```js
await redisClient.lpush(
  QUEUE_NAME,
  JSON.stringify(job)
);
```

Example:

```text
Before:
[]

After:
[Job1]
```

---

## RPOP

Removes an element from the right side of the list.

```js
await redisClient.rpop(QUEUE_NAME);
```

Example:

```text
Before:
[Job3, Job2, Job1]

After:
[Job3, Job2]
```

Removed:

Job1

````

---

## Why LPUSH + RPOP?

Using:

```text
LPUSH + RPOP
````

creates FIFO behavior:

```text
First In
First Out
```

Example:

```text
Add Job1
Add Job2
Add Job3

Process Job1
Process Job2
Process Job3
```

This mimics a traditional queue.

---

## LLEN

Returns the number of items in the queue.

```js
await redisClient.llen(QUEUE_NAME);
```

Example response:

```json
{
  "queueLength": 5
}
```

---

# Current Flow

## Add Job

Request:

```http
POST /send-email
```

Flow:

```text
Request
   ↓
Create Job Object
   ↓
Serialize Job
   ↓
LPUSH
   ↓
Redis Queue
```

---

## Process Job

Request:

```http
GET /emails/process-one
```

Flow:

```text
Worker
   ↓
RPOP
   ↓
Deserialize Job
   ↓
Send Email
```

---

# Serialization

Redis stores strings.

Before storing:

```js
JSON.stringify(job)
```

Object:

```js
{
  to: "abc@gmail.com"
}
```

becomes:

```json
"{\"to\":\"abc@gmail.com\"}"
```

This process is called:

## Serialization

Converting an object into a transferable format.

---

# Deserialization

When reading from Redis:

```js
JSON.parse(jobData)
```

String:

```json
"{\"to\":\"abc@gmail.com\"}"
```

becomes:

```js
{
  to: "abc@gmail.com"
}
```

This process is called:

## Deserialization

Converting stored data back into objects.

---

# Advantages of Queue-Based Processing

## Faster API Responses

Without queue:

```text
Create User
Send Email
Return Response
```

User waits.

With queue:

```text
Create User
Push Job
Return Response
```

Response is immediate.

---

## Better Scalability

Multiple workers can process jobs concurrently.

```text
Redis Queue
     │
 ┌───┼───┐
 ▼   ▼   ▼
W1  W2  W3
```

---

## Decoupling

Business logic does not depend on email service speed.

---

# Limitations of Current Implementation

This implementation is intentionally simple and has some limitations.

## No Acknowledgement Mechanism

Current flow:

```text
RPOP
 ↓
Process Job
```

If worker crashes after RPOP:

```text
Job Lost
```

because the job has already been removed.

---

## No Retry Mechanism

Failed jobs are discarded.

Example:

```text
SMTP Failure
 ↓
Job Lost
```

---

## No Dead Letter Queue

Failed jobs are not stored separately for later investigation.

---

## Polling-Based Processing

Worker must continuously request:

```http
GET /emails/process-one
```

which is inefficient.

---

# Improvements

## Use BRPOP

Instead of:

```js
RPOP
```

use:

```js
BRPOP
```

Blocking Right Pop.

Worker waits until a job arrives.

Benefits:

* No polling
* Lower CPU usage
* More efficient

Example:

```js
await redisClient.brpop(
  QUEUE_NAME,
  0
);
```

---

## Implement Retry Logic

Store retry count:

```json
{
  "email": "user@example.com",
  "retries": 2
}
```

Retry failed jobs before discarding.

---

## Dead Letter Queue (DLQ)

Move failed jobs to:

```text
queue:emails:failed
```

for later inspection.

---

## Separate Worker Process

Instead of exposing:

```http
GET /emails/process-one
```

run a dedicated worker:

```js
while (true) {
  const job = await redisClient.brpop(
    QUEUE_NAME,
    0
  );

  processJob(job);
}
```

---

## Use BullMQ

For production systems, use BullMQ.

Features:

* Retries
* Delayed jobs
* Concurrency
* Job status tracking
* Dead Letter Queues
* Rate limiting

Example:

```js
emailQueue.add(
  "send-email",
  payload
);
```

---

# Alternative Redis Queue Commands

## RPUSH + LPOP

Also creates FIFO queue.

```text
Producer → RPUSH
Consumer → LPOP
```

---

## LPUSH + BRPOP

FIFO queue with blocking reads.

---

## Redis Streams

Modern Redis data structure for messaging.

Features:

* Consumer groups
* Acknowledgements
* Message replay
* Better reliability

Used for production-grade event processing.

---

# Key Learnings

* Redis Lists can be used as lightweight message queues.
* Producers add jobs using LPUSH.
* Consumers process jobs using RPOP.
* LPUSH + RPOP creates FIFO behavior.
* Queues help offload slow tasks from the request-response cycle.
* Background processing improves performance and scalability.
* Production systems typically use BRPOP, BullMQ, RabbitMQ, Kafka, or Redis Streams for additional reliability.