# Foundation Of Redis

## What Is Redis?

Redis stands for **Remote Dictionary Server**.

It is a very fast data store that keeps data mainly in memory.

Memory means RAM, the fast temporary storage used by a running computer. Reading from RAM is much faster than reading from disk storage like an SSD or hard drive.

Redis stores data as key-value pairs.

Example:

```txt
key: user:1:name
value: Deepthi
```

You can think of Redis like a very fast dictionary or map:

```txt
"user:1:name" -> "Deepthi"
"cart:42" -> ["book", "pen"]
"otp:9999" -> "123456"
```

## Why Is Redis Fast?

Redis is fast mainly because:

- It stores data in memory.
- It uses simple data structures.
- Most commands are designed to finish quickly.
- It avoids heavy database work like complex joins.

A traditional database often stores data on disk and supports complex querying.

Redis focuses on very fast access to known keys.

Example:

```txt
Give me the value for key "user:1:name"
```

This is faster than asking a database to search across many tables.

## Why Is Redis Used?

Redis is used when an application needs fast reads, fast writes, or temporary data.

Common reasons:

- Reduce database load.
- Make repeated reads faster.
- Store temporary information.
- Share small pieces of state between servers.
- Build queues and real-time features.
- Count events quickly.

## Where Redis Is Commonly Used

### Caching

A cache is a temporary fast storage layer.

Instead of repeatedly asking the database for the same data, the application can store the result in Redis.

Flow:

```txt
1. User asks for product details.
2. App checks Redis first.
3. If data exists in Redis, return it quickly.
4. If data is missing, read from database.
5. Store database result in Redis.
6. Return result to user.
```

This reduces database work and improves response time.

### Session Storage

A session stores information about a logged-in user.

Example:

```txt
session:abc123 -> userId: 42
```

Redis is useful for sessions because it is fast and can expire old sessions automatically.

### Rate Limiting

Rate limiting means controlling how many requests a user can make in a time period.

Example:

```txt
Allow only 100 requests per minute per user.
```

Redis can quickly count requests:

```txt
rate:user:42 -> 23
```

If the count becomes too high, the app blocks or slows down the user.

### OTPs And Temporary Tokens

OTP means One-Time Password.

Redis is useful because OTPs should expire after a short time.

Example:

```txt
otp:user:42 -> 839201
expires after 5 minutes
```

### Queues

A queue stores jobs that need to be processed later.

Example:

```txt
send email
generate invoice
resize image
process payment webhook
```

Instead of doing all work immediately inside a request, the app can push a job into Redis and let a worker process it later.

A worker is a background program that picks jobs from the queue and performs them.

### Leaderboards

Redis has a data type called a sorted set.

A sorted set stores items with scores.

Example:

```txt
Deepthi -> 950
Alex -> 870
Sam -> 730
```

This is useful for game leaderboards, rankings, and top-N lists.

### Pub/Sub

Pub/Sub means publish and subscribe.

- A publisher sends a message.
- Subscribers listening to that channel receive the message.

Example:

```txt
Publisher sends message to channel "chat"
Subscribers of "chat" receive it
```

This is useful for real-time notifications and simple message broadcasting.

## How Redis Works

At a basic level:

```txt
Application -> Redis command -> Redis stores/reads data -> Application gets response
```

Example command:

```txt
SET name Deepthi
```

This stores:

```txt
name -> Deepthi
```

Another command:

```txt
GET name
```

This returns:

```txt
Deepthi
```

## Redis Is In-Memory

Redis keeps data primarily in RAM.

That makes it very fast, but RAM is limited compared to disk.

Because of this, Redis is usually used for:

- Frequently accessed data.
- Temporary data.
- Small fast lookups.
- Counters and queues.

Redis is usually not used as the only place for important permanent business data unless the system is designed carefully.

## Persistence

Persistence means saving data so it can survive a restart.

Although Redis is in-memory, it can also save data to disk.

Redis supports persistence options such as:

- RDB snapshots.
- AOF logs.

RDB means Redis Database file.

It saves a snapshot of Redis data at intervals.

AOF means Append Only File.

It records write operations so Redis can replay them after restart.

Simple idea:

```txt
RDB -> save full picture sometimes
AOF -> write down every change
```

## TTL And Expiration

TTL means Time To Live.

It controls how long a key should exist.

Example:

```txt
otp:user:42 -> 123456
TTL -> 5 minutes
```

After 5 minutes, Redis automatically deletes the key.

TTL is useful for:

- OTPs.
- Login sessions.
- Cache entries.
- Temporary locks.

## Common Redis Data Types

Redis is not only a string key-value store. It supports multiple data types.

### String

A simple value.

Example:

```txt
name -> Deepthi
```

Used for:

- Cache values.
- Counters.
- Tokens.

### List

An ordered collection of values.

Example:

```txt
tasks -> [send-email, resize-image, generate-report]
```

Used for:

- Queues.
- Recent activity.

### Set

A collection of unique values.

Example:

```txt
online-users -> [user1, user2, user3]
```

Used for:

- Unique tags.
- Online users.
- Membership checks.

### Sorted Set

A collection of unique values with scores.

Example:

```txt
leaderboard -> Deepthi:950, Alex:870
```

Used for:

- Rankings.
- Leaderboards.
- Priority-based lists.

### Hash

A group of fields under one key.

Example:

```txt
user:42 -> name: Deepthi, age: 25, city: Bengaluru
```

Used for:

- User profiles.
- Object-like data.

## Redis And Databases

Redis is often used with a primary database.

Example:

```txt
PostgreSQL/MySQL/MongoDB -> source of truth
Redis -> fast cache or temporary store
```

Source of truth means the main reliable place where important data is stored.

Redis helps the application become faster, but the main database often remains responsible for permanent records.

## Cache Hit And Cache Miss

Cache hit means the requested data is found in Redis.

```txt
App asks Redis for product:10
Redis has product:10
This is a cache hit
```

Cache miss means the requested data is not found in Redis.

```txt
App asks Redis for product:10
Redis does not have it
This is a cache miss
App reads from database
App stores result in Redis
```

## Cache Invalidation

Cache invalidation means removing or updating stale cache data.

Stale means old or no longer correct.

Example:

```txt
Product price changes in database.
Old price still exists in Redis.
Redis data is stale.
```

Common strategies:

- Delete the Redis key when database data changes.
- Update the Redis key when database data changes.
- Use TTL so old data expires automatically.

## Redis Eviction

Eviction means Redis removes keys when memory is full.

Redis can be configured with policies like:

- Remove keys that are close to expiring.
- Remove least recently used keys.
- Reject new writes.

Least recently used means data that has not been used for the longest time.

## When To Use Redis

Use Redis when:

- You need very fast reads and writes.
- Data is temporary.
- Data can be rebuilt from another source.
- You need counters, queues, sessions, or rate limits.
- You want to reduce database load.
- You need automatic expiration.

Good examples:

- Product cache.
- User session store.
- OTP store.
- API rate limiter.
- Background job queue.
- Notification pub/sub.
- Leaderboard.

## When Not To Use Redis

Avoid Redis as the only storage when:

- Data must be permanently stored and cannot be lost.
- You need complex queries and joins.
- Data is too large for memory.
- You need strong relational constraints.

Use a primary database for those cases.

## Simple Mental Model

Think of Redis as:

```txt
A very fast shared memory store for your application.
```

It is especially useful for data that is:

- Frequently read.
- Temporary.
- Small enough to fit in memory.
- Needed by multiple app servers.

## Quick Summary

- Redis is an in-memory key-value data store.
- It is fast because it mainly uses RAM.
- It is commonly used for caching, sessions, rate limiting, queues, OTPs, pub/sub, and leaderboards.
- It supports data types like strings, lists, sets, sorted sets, and hashes.
- TTL lets Redis automatically expire keys.
- Redis can persist data to disk, but it is often used alongside a primary database.
- Redis is best for speed and temporary or easily rebuildable data.
