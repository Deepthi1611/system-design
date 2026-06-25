# Cache-Aside Strategy

This is a simple example of the **cache-aside** pattern.

## How it works

1. Check the cache first.
2. If data is found, return it.
3. If data is not found, read it from the database.
4. Save that data in the cache.
5. Return the data.

When data is updated, the application updates the database first and then clears the old cache entry.

## Why it is used

- Reduces repeated database reads
- Improves response time
- Keeps the logic simple

## Example flow in this code

- The first `getUser(1)` call is a **cache miss**
- The data is loaded from the fake database and stored in cache
- The second `getUser(1)` call is a **cache hit**
- After `updateUser(1, ...)`, the cache is cleared
- The next read again fetches from the database and stores fresh data in cache

## Run the example

```bash
node index.js
```

## Files

- `index.js`: basic cache-aside example using a `Map` as cache
- `README.md`: short explanation
