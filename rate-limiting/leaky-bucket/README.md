# Leaky Bucket with Redis

This example implements a **leaky bucket** rate limiter.

## Idea

Imagine requests being poured into a bucket.

- new requests increase the water level
- water leaks out slowly at a fixed speed
- if the bucket is full, new requests are blocked

## What this code does

- Stores `waterLevel` and `lastLeak` in Redis
- Calculates how much water should have leaked by now
- Adds the new request to the bucket
- Blocks the request if the bucket would overflow

## Redis key used

```text
rate_limit:leaky_bucket:<userId>
```

## Why this is useful

- Smooths traffic
- Prevents sudden spikes from hitting the system
- Good when you want a steady output rate

## Limitation

- It is stricter than token bucket for burst handling

## API

### Check request

```bash
POST /check
```

Request body:

```json
{
  "userId": "user-1"
}
```

## Run

```bash
npm install
npm start
```

Server runs on:

```bash
http://localhost:3005
```

## Example

```bash
curl -X POST http://localhost:3005/check \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-1"}'
```
