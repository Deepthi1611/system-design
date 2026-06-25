# Read-Through Strategy

This is a simple example of the **read-through** caching pattern.

## How it works

1. The application asks the cache for data.
2. If the data exists, the cache returns it.
3. If the data does not exist, the cache reads it from the database.
4. The cache stores that data and returns it.

In this pattern, the cache is responsible for loading missing data.

## Why it is used

- Keeps read logic simple
- Reduces repeated database reads
- Returns fast responses after the first read

## Example flow in this code

- `getUser(1)` calls `cache.get(1)`
- On a **cache miss**, the cache itself reads from the fake database
- The cache stores the result and returns it
- The second read is a **cache hit**

## Difference from cache-aside

- In **cache-aside**, the application checks the cache and then reads the database on a miss
- In **read-through**, the application only asks the cache, and the cache handles the database read

## Run the example

```bash
node index.js
```
