# Rate Limiting with Redis

This folder contains simple Redis-based implementations of common rate limiting strategies.

Each strategy lives in its own folder:

- `fixed-window-counter`
- `sliding-window-log`
- `sliding-window-counter`
- `token-bucket`
- `leaky-bucket`

Every folder contains:

- `src/index.js` - Express server with the rate limiting logic
- `package.json` - dependencies and scripts
- `README.md` - simple explanation and sample API usage

All examples use:

- `Express` for the HTTP server
- `ioredis` for talking to Redis

Make sure Redis is running locally on:

```bash
redis://localhost:6379
```

You can also override it with:

```bash
REDIS_URL=redis://localhost:6379
```
