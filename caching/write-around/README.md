# Write-Around Strategy

This is a simple example of the **write-around** caching pattern.

## How it works

1. The application writes data directly to the database.
2. The cache is not updated during the write.
3. When data is read later, it is loaded into cache if needed.

This avoids filling the cache with data that may not be read soon.

## Why it is used

- Keeps unnecessary writes out of cache
- Useful when writes happen often but reads are less frequent
- Helps avoid cache pollution

## Example flow in this code

- `writeUser(...)` updates only the database
- The first read is a **cache miss**
- That read loads data from the database into cache
- The second read is a **cache hit**

## Run the example

```bash
node index.js
```
