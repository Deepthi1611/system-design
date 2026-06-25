# Write-Back Strategy

This is a simple example of the **write-back** caching pattern.

## How it works

1. The application writes data to the cache first.
2. The database is updated later.
3. A flush step moves data from cache to database.

In this pattern, writes are fast because the database update is delayed.

## Why it is used

- Faster writes
- Useful when many writes happen frequently
- Reduces direct database load

## Example flow in this code

- `writeUser(...)` updates only the cache
- The database still has the old value
- `flushCacheToDatabase(...)` writes the latest cached value to the database

## Run the example

```bash
node index.js
```
