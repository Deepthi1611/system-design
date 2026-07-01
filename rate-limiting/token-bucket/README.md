# Token Bucket with Redis

This example implements a **token bucket** rate limiter.

## Idea

Imagine a bucket that holds tokens.

- each request needs 1 token
- tokens are added back slowly over time
- if a token is available, the request is allowed
- if no token is available, the request is blocked

## What this code does

- Stores `tokens` and `lastRefill` in Redis
- Recalculates how many tokens should be available now
- Removes 1 token when a request is accepted
- Blocks the request when the bucket is empty

## Redis key used

```text
rate_limit:token_bucket:<userId>
```

## Why this is useful

- Allows short bursts
- Still keeps long-term traffic under control
- Common in APIs and gateways

## Limitation

- Slightly more complex than a simple counter

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
http://localhost:3004
```

## Example

```bash
curl -X POST http://localhost:3004/check \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-1"}'
```
