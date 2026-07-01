# Sliding Window Log with Redis

This example implements a **sliding window log** rate limiter.

## Idea

Instead of counting requests by minute blocks, we store the timestamp of each request.

For every new request:

- remove old timestamps outside the last 60 seconds
- add the current request timestamp
- count how many timestamps are left

If the count is more than the limit, we block the request.

## What this code does

- Uses a Redis sorted set for each user
- Stores request timestamps as scores
- Removes old entries with `ZREMRANGEBYSCORE`
- Adds the new request with `ZADD`
- Counts requests with `ZCARD`

## Redis key used

```text
rate_limit:sliding_log:<userId>
```

## Why this is useful

- More accurate than fixed window
- Avoids big bursts at window boundaries

## Limitation

- Uses more memory because every request timestamp is stored

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
http://localhost:3002
```

## Example

```bash
curl -X POST http://localhost:3002/check \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-1"}'
```
