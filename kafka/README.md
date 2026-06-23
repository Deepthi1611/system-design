# Apache Kafka - Message Streaming Demo

## Overview

This project demonstrates Apache Kafka's core functionality using **kafkajs** in Node.js. Kafka is a distributed event streaming platform that allows you to publish, subscribe, and process streams of events (messages) in real-time.

Instead of traditional request-response communication, Kafka enables asynchronous, decoupled messaging where producers send messages to topics, and consumers subscribe to read them.

---

## Why Kafka?

- **Scalability**: Handle millions of messages per second
- **Durability**: Messages are persisted to disk
- **Decoupling**: Producers and consumers don't need to know about each other
- **Real-time processing**: Stream data in real-time
- **Replayability**: Consumers can replay messages from any point in time
- **Partitioning**: Distribute messages across multiple partitions for parallel processing

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Kafka Broker Cluster                     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ TOPIC: rider-updates                                 │   │
│  │ ┌─────────────────────┐  ┌─────────────────────────┐ │   │
│  │ │   Partition 0       │  │     Partition 1         │ │   │
│  │ │   (North Region)    │  │   (South Region)        │ │   │
│  │ │                     │  │                         │ │   │
│  │ │ [msg1] [msg2] ...   │  │ [msg1] [msg2] ...       │ │   │
│  │ └─────────────────────┘  └─────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ▲                                   │
└──────────────┬───────────┼───────────────────┬──────────────┘
               │           │                   │
          PRODUCES    CONSUMES            REPLICATES
               │           │                   │
        ┌──────▼──┐  ┌─────▼─────┐     ┌──────▼──────┐
        │Producer │  │ Consumer  │     │ Replication │
        │ (sends  │  │ (receives │     │   (backup)  │
        │messages)│  │messages)  │     │             │
        └─────────┘  └───────────┘     └─────────────┘
```

---

## Project Structure

```
kafka/
├── client.js         # Kafka client configuration
├── producer.js       # Publishes messages to topics
├── consumer.js       # Subscribes to topics and processes messages
├── admin.js          # Creates and manages topics
└── package.json      # Project dependencies
```

---

## Key Files Explained

### 1. `client.js` - Kafka Client Setup

Establishes a connection to the Kafka broker.

```javascript
import {Kafka} from 'kafkajs';

export const kafka = new Kafka({
  clientId: 'my-app',           // unique identifier for this application
  brokers: ['192.168.0.106:9092'] // Kafka broker address
});
```

**Key Points:**
- `clientId`: unique identifier for your application
- `brokers`: list of Kafka broker URLs (can be multiple for cluster)
- All other files import this `kafka` instance

---

### 2. `admin.js` - Topic Management

Creates topics where messages will be stored.

```javascript
const admin = kafka.admin();
await admin.connect();

await admin.createTopics({
  topics: [{
    topic: 'rider-updates',
    numPartitions: 2,  // split data across 2 partitions
  }]
});
```

**What It Does:**
- Connects to Kafka cluster as an admin
- Creates the topic `rider-updates` with 2 partitions
- Partition 0 = North Region
- Partition 1 = South Region

**When to Run:**
```bash
node admin.js
```

Run this **once** to create the topic. Running again will throw an error if topic already exists.

---

### 3. `producer.js` - Publishing Messages

Sends messages to a specific topic and partition.

```javascript
const producer = kafka.producer();
await producer.connect();

await producer.send({
  topic: 'rider-updates',
  messages: [
    { partition: 1, key: 'driver-name', value: 'South' },
  ],
});
```

**Key Concepts:**
- **topic**: where the message is sent (`rider-updates`)
- **partition**: specific partition within the topic (0 = North, 1 = South)
- **key**: identifier for the message (used for grouping/partitioning)
- **value**: the actual message content

**Producer Flow:**
```
Producer → topic: rider-updates → partition: 1 → Kafka Broker → Stored on Disk
```

**When to Run:**
```bash
node producer.js
```

Run this to publish a message. Can be run multiple times.

---

### 4. `consumer.js` - Consuming Messages

Subscribes to a topic and processes incoming messages.

```javascript
const consumer = kafka.consumer({ groupId: 'rider-group' });
await consumer.connect();

await consumer.subscribe({ 
  topic: 'rider-updates', 
  fromBeginning: true  // read from earliest message
});

await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    console.log(`Received: ${message.value} on partition ${partition}`);
  },
});
```

**Key Concepts:**
- **groupId**: `rider-group` - multiple consumers with same groupId form a consumer group
- **fromBeginning**: `true` = read all messages from the start; `false` = only new messages
- **eachMessage**: callback function executed for each message

**Consumer Flow:**
```
Kafka Broker → Read from topic: rider-updates → Process Messages → Log Output
```

**When to Run:**
```bash
node consumer.js
```

Run this to subscribe to messages. It runs continuously until stopped (Ctrl+C).

---

## Message Flow Diagram

### Single Message Journey

```
┌─────────────────────────────────────────────────────────────┐
│ PRODUCER PUBLISHES A MESSAGE                                │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Topic: rider-updates                                 │   │
│ │ Partition: 1 (South)                                 │   │
│ │ Key: driver-name                                     │   │
│ │ Value: South                                         │   │
│ └──────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ KAFKA BROKER STORES MESSAGE                                 │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ rider-updates topic                                  │   │
│ │ ┌─────────────────┐  ┌──────────────────────────┐   │   │
│ │ │ Partition 0     │  │ Partition 1              │   │   │
│ │ │ (North)         │  │ (South)                  │   │   │
│ │ │                 │  │ [South]  <-- new msg    │   │   │
│ │ └─────────────────┘  └──────────────────────────┘   │   │
│ └──────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ CONSUMER READS MESSAGE                                      │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Consumer Group: rider-group                          │   │
│ │ Status: Subscribed to rider-updates                 │   │
│ │ Offset: 0 (which message to read)                   │   │
│ │ Message Received: "South"                           │   │
│ │ Output: Received: South on partition 1              │   │
│ └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Concepts

### Topic
A named stream of messages. Messages are organized by topic. Example: `rider-updates`, `user-events`, `order-status`.

### Partition
Topics are divided into partitions for parallel processing. Each partition is an ordered log of messages.

Example with 2 partitions:
```
Topic: rider-updates
├── Partition 0 (North): [msg1, msg2, msg3, ...]
└── Partition 1 (South): [msg1, msg2, msg3, ...]
```

### Producer
An application that sends messages to Kafka topics.

### Consumer
An application that reads messages from Kafka topics.

### Consumer Group
Multiple consumers with the same `groupId` form a consumer group. They collectively consume a topic's partitions without message duplication.

### Offset
The position of a message in a partition. Consumers track their offset to know which messages they've read.

```
Partition 0:
Offset 0: [Message 1]
Offset 1: [Message 2]
Offset 2: [Message 3]
         ▲
      Consumer is here
```

### Replication
Kafka replicates partitions across multiple brokers for fault tolerance and durability.

---

## Running the Demo

### Prerequisites
- Kafka broker running on `192.168.0.106:9092`
- Node.js installed with kafkajs dependency

### Step-by-Step

1. **Create the Topic** (run once)
   ```bash
   node admin.js
   ```
   Output:
   ```
   admin connected
   topic created rider-updates
   admin disconnected
   ```

2. **Start the Consumer** (Terminal 1 - runs continuously)
   ```bash
   node consumer.js
   ```
   Output:
   ```
   consumer connected
   subscribed to topic rider-updates
   [waiting for messages...]
   ```

3. **Publish a Message** (Terminal 2 - run multiple times)
   ```bash
   node producer.js
   ```
   Output:
   ```
   producer connected
   message sent to topic rider-updates
   producer disconnected
   ```

4. **See Consumer Receive Message** (Terminal 1)
   ```
   Received message: South on partition 1
   ```

---

## Use Cases for Kafka

| Use Case | Example |
|----------|---------|
| **Real-time Analytics** | Track user activity, clicks, events |
| **Log Aggregation** | Collect logs from multiple services |
| **Event Sourcing** | Store all state changes as events |
| **Microservices Communication** | Decouple services with event streaming |
| **Data Pipeline** | Stream data from sources to data warehouse |
| **IoT Data** | Ingest sensor data from millions of devices |
| **Social Media Feed** | Stream user activities, posts, likes |

---

## Kafka vs Other Solutions

| Feature | Kafka | RabbitMQ | Redis Queue |
|---------|-------|----------|------------|
| **Throughput** | Very High | High | High |
| **Persistence** | Yes | Yes | No (unless configured) |
| **Replayability** | Yes | No | No |
| **Partitioning** | Yes | No | No |
| **Scaling** | Horizontal (easy) | Horizontal (complex) | Vertical (limited) |
| **Complexity** | High | Low | Low |

---

## Advanced Concepts (Not in this demo)

### Consumer Lag
The difference between the latest offset and the consumer's current offset. Indicates how behind the consumer is.

```
Latest Offset: 100
Consumer Offset: 95
Lag: 5 messages
```

### Rebalancing
When a new consumer joins a group or a consumer crashes, Kafka automatically redistributes partitions among consumers.

### Exactly Once Semantics
Ensures messages are processed exactly once, not lost and not duplicated.

### Compression
Kafka can compress messages (gzip, snappy, lz4) to reduce storage and network usage.

---

## Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Connection refused` | Kafka broker not running | Start Kafka broker on `192.168.0.106:9092` |
| `Topic already exists` | Running admin.js twice | Skip admin.js if topic exists |
| `ENOTFOUND broker` | Wrong broker address | Check broker IP in `client.js` |
| `Timeout` | Network/firewall issue | Verify network connectivity to broker |

---

## Improvements & Extensions

1. **Add Error Handling**: Wrap connect/send/run in try-catch
2. **Add Multiple Producers**: Send batch messages
3. **Add Multiple Consumers**: Scale message processing
4. **Add Key-Based Partitioning**: Route messages by key
5. **Add Consumer Group Monitoring**: Track consumer lag
6. **Add Message Compression**: Reduce payload size
7. **Add Schema Validation**: Use Avro or Protobuf
8. **Add Metrics**: Track messages sent/received
9. **Add Graceful Shutdown**: Handle process termination
10. **Add Configuration Management**: Use environment variables

---

## Key Takeaways

- **Kafka is a distributed streaming platform** for high-throughput, low-latency messaging
- **Producers publish** messages to topics
- **Consumers subscribe** to topics and process messages
- **Partitions enable parallel processing** and fault tolerance
- **Offsets allow replayability** of messages
- **Consumer groups prevent message duplication** among multiple consumers
- **Kafka is persistent and fault-tolerant** – data survives broker crashes

---

## References

- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [kafkajs Documentation](https://kafka.js.org/)
- [Kafka Design](https://kafka.apache.org/design)

---

## Next Steps

1. Explore consumer groups with multiple consumers
2. Implement batch message production
3. Add message filtering and transformation
4. Implement exactly-once processing semantics
5. Set up Kafka Connect for data integration
6. Monitor Kafka with tools like Kafdrop or Confluent Control Center
