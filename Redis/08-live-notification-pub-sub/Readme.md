# Redis Pub/Sub (Publish-Subscribe Pattern)

## Overview

This project demonstrates how to implement the Publish-Subscribe (Pub/Sub) messaging pattern using Redis and Node.js.

Redis Pub/Sub allows applications to communicate through channels without directly knowing about each other.

This creates loose coupling between services and enables real-time event broadcasting.

---

# What is Pub/Sub?

Pub/Sub (Publish-Subscribe) is a messaging pattern where:

* Publishers send messages
* Subscribers receive messages
* Neither knows about the other
* Redis acts as the message broker

Instead of:

```text id="4vh8gh"
Service A
   ↓
Service B
```

direct communication,

we use:

```text id="m6s8dz"
Publisher
    ↓
 Redis
    ↓
Subscriber
```

---

# Core Components

## Publisher

A publisher sends messages to a Redis channel.

In this project:

```js id="3pnnv5"
POST /notifications
```

acts as the publisher.

Example:

```js id="vk6x2g"
publisher.publish(
  "notifications",
  JSON.stringify(payload)
);
```

---

## Subscriber

A subscriber listens to a channel.

In this project:

```js id="d8axj6"
subscriber.subscribe("notifications");
```

acts as the subscriber.

---

## Channel

A channel is a logical topic where messages are published.

Example:

```text id="aqjrtu"
notifications
```

Channels are not queues.

They are simply communication streams.

---

## Message Broker

Redis acts as the broker.

Responsibilities:

* Receive published messages
* Identify subscribers
* Deliver messages immediately

---

# Architecture

```text id="b8s1cv"
Client
   │
   ▼
POST /notifications
   │
   ▼
Publisher
   │
   ▼
Redis Channel
(notifications)
   │
   ▼
Subscriber A

Subscriber B

Subscriber C
```

---

# Project Structure

```text id="zll3hh"
.
├── api.js
└── subscriber.js
```

---

# Publisher Flow

File:

```text id="5s0jgu"
api.js
```

---

## Step 1

Client sends request:

```http id="1e31dd"
POST /notifications
```

Request:

```json id="1n06yz"
{
  "title": "Server Maintenance",
  "message": "Scheduled maintenance tonight"
}
```

---

## Step 2

Publisher creates payload:

```js id="1xj6s3"
const payload = {
  title,
  message,
  timestamp
};
```

---

## Step 3

Payload is serialized:

```js id="hdlp20"
JSON.stringify(payload)
```

---

## Step 4

Publish to channel:

```js id="i0tbz7"
publisher.publish(
  "notifications",
  payload
);
```

---

## Step 5

Redis broadcasts message to all active subscribers.

---

# Subscriber Flow

File:

```text id="6k3im4"
subscriber.js
```

---

## Step 1

Create Redis connection:

```js id="85gs0u"
const subscriber = new Redis(...)
```

---

## Step 2

Subscribe:

```js id="gjtuv8"
subscriber.subscribe(
  "notifications"
);
```

Redis registers this client as a listener.

---

## Step 3

Wait for messages:

```js id="5g7ldm"
subscriber.on(
  "message",
  callback
);
```

---

## Step 4

Redis pushes messages automatically.

No polling required.

---

## Step 5

Subscriber receives:

```js id="wl4m4s"
channel
message
```

Example:

```text id="j7hmzy"
notifications
```

```json id="l2bvtg"
{
  "title": "Server Maintenance",
  "message": "Scheduled maintenance tonight"
}
```

---

# End-to-End Flow

```text id="r7cy5c"
Client
   │
   ▼
POST /notifications
   │
   ▼
Publisher
   │
 publish()
   │
   ▼
Redis
   │
   ▼
Channel: notifications
   │
 ┌─┴───────────────┐
 ▼                ▼
Subscriber A    Subscriber B
```

---

# What Happens Internally?

Suppose:

```js id="iqs5ez"
publish(
  "notifications",
  payload
);
```

Redis:

1. Finds all subscribers for the channel
2. Pushes the message to each subscriber
3. Returns subscriber count

Example:

```js id="cl4jhv"
const receivers =
  await publisher.publish(...)
```

Response:

```json id="hghwhq"
{
  "receivers": 3
}
```

Meaning:

```text id="zvjdif"
3 subscribers received the message
```

---

# Serialization

Before publishing:

```js id="y6p4tb"
JSON.stringify(payload)
```

Object:

```js id="bzv8xa"
{
  title: "Hello"
}
```

becomes:

```json id="1s1m5l"
"{\"title\":\"Hello\"}"
```

---

# Deserialization

Subscriber converts:

```js id="j56vd5"
JSON.parse(message)
```

String back into object.

---

# Key Characteristics of Redis Pub/Sub

## Real-Time

Messages are delivered immediately.

---

## One-to-Many Communication

One publisher can notify many subscribers.

```text id="wz3mkq"
Publisher
    │
    ▼
Redis
    │
 ┌──┼──┐
 ▼  ▼  ▼
S1 S2 S3
```

---

## Decoupled Architecture

Publisher does not know:

* who subscribes
* how many subscribers exist
* where subscribers are running

---

## Event-Driven Communication

Publish events:

```text id="l1efzr"
UserRegistered
OrderPlaced
PaymentCompleted
```

Subscribers react independently.

---

# Important Limitation

Redis Pub/Sub provides:

```text id="0mlv62"
At-most-once delivery
```

---

## What does this mean?

If a subscriber is offline:

```text id="wk8h5x"
Publisher
   ↓
Redis
   ↓
Offline Subscriber
```

Message is lost.

Redis does NOT store messages.

---

Example:

```text id="f0yehq"
Subscriber disconnected
```

Publisher sends:

```text id="n5zj55"
Hello
```

Subscriber reconnects later.

Result:

```text id="xl5m0p"
Message lost forever
```

---

# Pub/Sub vs Queue

## Redis Pub/Sub

```text id="5t0n39"
Publisher
   ↓
Redis
   ↓
Subscriber
```

Messages are:

```text id="6ncfwv"
NOT persisted
```

Good for:

* Notifications
* Live updates
* Chat messages
* Real-time events

---

## Redis Queue

```text id="8bpln5"
Producer
   ↓
Queue
   ↓
Consumer
```

Messages are:

```text id="hkp8qx"
Stored until processed
```

Good for:

* Emails
* Payments
* Background jobs
* Order processing

---

# Use Cases

## Live Notifications

```text id="t1z7bm"
System alerts
```

---

## Chat Applications

```text id="l18syt"
User messages
```

---

## WebSocket Gateways

Broadcast events.

---

## Real-Time Dashboards

Push updates instantly.

---

## Multiplayer Games

Broadcast player actions.

---

# Improvements

## 1. Handle Connection Errors

```js id="zh9hzr"
subscriber.on(
  "error",
  (err) => {
    console.error(err);
  }
);
```

---

## 2. Multiple Subscribers

Run multiple subscriber instances:

```text id="mg3pna"
subscriber-1
subscriber-2
subscriber-3
```

All receive broadcasts.

---

## 3. Channel Separation

Instead of:

```text id="0iy58e"
notifications
```

create:

```text id="5cr3zg"
orders
payments
notifications
emails
```

for better organization.

---

## 4. Use Pattern Subscriptions

Subscribe to multiple channels:

```js id="xhxag4"
subscriber.psubscribe(
  "notifications:*"
);
```

Example channels:

```text id="gl8hba"
notifications:user
notifications:admin
notifications:system
```

---

## 5. Consider Redis Streams for Reliability

If messages must survive subscriber downtime:

Use Redis Streams instead of Pub/Sub.

Streams provide:

* Message persistence
* Consumer groups
* Acknowledgements
* Replay capability

which Pub/Sub does not support.

---

# Key Learnings

* Redis Pub/Sub implements the Publish-Subscribe messaging pattern.
* Publishers send messages to channels.
* Subscribers listen to channels.
* Redis acts as a message broker.
* Messages are pushed instantly.
* Pub/Sub is real-time and loosely coupled.
* Messages are not persisted.
* Offline subscribers miss messages.
* Best suited for notifications, chat systems, and event broadcasting.
* For reliable message processing, use Queues or Redis Streams.