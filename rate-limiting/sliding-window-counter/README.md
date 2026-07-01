# Sliding Window Counter with Redis

This example implements a **sliding window counter** rate limiter.

## Idea

This strategy is a middle ground between:

- fixed window counter
- sliding window log

Instead of storing every request, we keep:

- current window count
- previous window count

Then we calculate an **estimated count** using a weighted value from the previous window.

## What this code does

- Reads the current window count from Redis
- Reads the previous window count from Redis
- Calculates how much of the previous window still matters
- Builds an estimated count
- Allows or blocks the request based on that estimate

## Redis keys used

```text
rate_limit:sliding_counter:<userId>:<windowStart>
```

## Why this is useful

- Uses less memory than sliding window log
- Smoother than fixed window
- Simple enough to understand

## Limitation

- It is an approximation, not an exact count

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
http://localhost:3003
```

## Example

```bash
curl -X POST http://localhost:3003/check \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-1"}'
```
