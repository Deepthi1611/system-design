# Fixed Window Counter with Redis

This example implements a **fixed window counter** rate limiter.

## Idea

We allow a fixed number of requests in a fixed time window.

Example:

- limit = `5 requests`
- window = `60 seconds`

If a user makes more than 5 requests in the same 60-second window, the extra requests are blocked.

## What this code does

- Takes a `userId` from the request body
- Builds a Redis key using the current minute window
- Uses `INCR` to increase the request count
- Uses `EXPIRE` so the key automatically disappears after the window ends
- Returns whether the request is allowed or blocked

## Redis key used

```text
rate_limit:fixed_window:<userId>:<windowStart>
```

## Why this is simple

- Easy to understand
- Easy to implement
- Very fast

## Limitation

This strategy can allow bursts near the window boundary.

Example:

- 5 requests at `12:00:59`
- 5 more requests at `12:01:01`

That becomes 10 requests in a very short time.

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
http://localhost:3001
```

## Example

```bash
curl -X POST http://localhost:3001/check \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-1"}'
```
