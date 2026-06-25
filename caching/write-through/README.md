# Write-Through Strategy

This is a simple example of the **write-through** caching pattern.

## How it works

1. The application writes data.
2. The data is written to the cache.
3. The same data is written to the database immediately.

Both cache and database stay updated at the same time.

## Why it is used

- Keeps cache and database consistent
- Makes reads fast because cache already has fresh data
- Simple to understand

## Example flow in this code

- `writeUser(...)` writes to the database and cache
- `getUser(...)` then reads the latest value
- The read is served from cache if it exists

## Run the example

```bash
node index.js
```
