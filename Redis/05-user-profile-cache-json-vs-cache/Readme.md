# User Profile Cache: JSON String vs Redis Hash

This project demonstrates two ways to store a user profile in Redis:

1. Serialize the entire object as JSON and store it with `SET`.
2. Store each property as a field in a Redis hash with `HSET`.

## Running the project

Make sure Redis is running on:

```txt
redis://localhost:6379
```

Then start the server:

```bash
npm run dev
```

The Express server runs on:

```txt
http://localhost:3000
```

## Redis connection

```js
const redisClient = new Redis(
  process.env.REDIS_URL || 'redis://localhost:6379'
);
```

This creates an `ioredis` client.

If the `REDIS_URL` environment variable exists, the application uses it. Otherwise, it connects to Redis on the local machine using port `6379`.

## Storing the profile as JSON

The JSON endpoint is:

```txt
POST /user/:id/json
```

Example request:

```bash
curl -X POST http://localhost:3000/user/1/json \
  -H "Content-Type: application/json" \
  -d '{"name":"Deepthi","email":"deepthi@example.com","age":25}'
```

The code converts the JavaScript object into a JSON string:

```js
await redisClient.set(
  `user:${userId}`,
  JSON.stringify(userData)
);
```

Redis stores it as one string value:

```txt
key: user:1
value: {"name":"Deepthi","email":"deepthi@example.com","age":25}
```

### Reading the JSON profile

The endpoint is:

```txt
GET /user/:id/json
```

The code gets the complete string:

```js
const userData = await redisClient.get(`user:${userId}`);
```

It then converts the JSON string back into a JavaScript object:

```js
JSON.parse(userData);
```

## Storing the profile as a Redis hash

The hash endpoint is:

```txt
POST /user/:id/hash
```

The code uses:

```js
await redisClient.hset(`user:${userId}`, userData);
```

If the request body is:

```json
{
  "name": "Deepthi",
  "email": "deepthi@example.com",
  "age": 25
}
```

Redis stores separate fields under one key:

```txt
key: user:1

name  -> Deepthi
email -> deepthi@example.com
age   -> 25
```

A Redis hash is similar to a JavaScript object or a map of fields and values.

## HSET

`HSET` creates or updates fields in a Redis hash.

Redis CLI example:

```redis
HSET user:1 name Deepthi email deepthi@example.com age 25
```

Updating only one field:

```redis
HSET user:1 age 26
```

Only `age` changes. Redis does not need the complete profile again.

With `ioredis`:

```js
await redisClient.hset('user:1', 'age', 26);
```

## HGETALL

`HGETALL` returns every field and value in a hash.

```js
const userData = await redisClient.hgetall(`user:${userId}`);
```

Result:

```js
{
  name: 'Deepthi',
  email: 'deepthi@example.com',
  age: '25'
}
```

Redis returns hash values as strings. Even if `age` was originally a number, it is returned as `'25'`.

## HGET

`HGET` reads one field instead of the complete hash.

Redis CLI:

```redis
HGET user:1 email
```

With `ioredis`:

```js
const email = await redisClient.hget('user:1', 'email');
```

Use `HGET` when only one field is required.

For example, an endpoint that needs only the user's email does not need to retrieve the name and age.

## HDEL

`HDEL` removes one or more fields from a hash without deleting the complete key.

Redis CLI:

```redis
HDEL user:1 age
```

With `ioredis`:

```js
await redisClient.hdel('user:1', 'age');
```

After this operation, the other fields remain:

```txt
name  -> Deepthi
email -> deepthi@example.com
```

To delete the complete user hash, use:

```js
await redisClient.del('user:1');
```

## HEXISTS

`HEXISTS` checks whether a field exists in a hash.

Redis CLI:

```redis
HEXISTS user:1 email
```

With `ioredis`:

```js
const exists = await redisClient.hexists('user:1', 'email');
```

Redis returns:

```txt
1 -> field exists
0 -> field does not exist
```

Example:

```js
if (await redisClient.hexists('user:1', 'email')) {
  console.log('The user has an email field');
}
```

## JSON string vs Redis hash

### JSON string

```js
SET user:1 '{"name":"Deepthi","age":25}'
```

The complete object is stored as one Redis string.

Advantages:

- Simple to store and retrieve.
- Preserves nested objects and arrays naturally.
- Easy when the application always needs the complete object.
- Works well for cached API or database responses.

Disadvantages:

- Updating one property requires reading, parsing, changing, and storing the complete JSON value.
- Redis cannot directly retrieve one property from the JSON string.
- Concurrent updates can overwrite each other if not handled carefully.

Example partial update with JSON:

```txt
GET complete profile
JSON.parse profile
change age
JSON.stringify profile
SET complete profile again
```

### Redis hash

```redis
HSET user:1 name Deepthi age 25
```

Each property is stored as a separate field.

Advantages:

- Read one field with `HGET`.
- Update one field with `HSET`.
- Delete one field with `HDEL`.
- Check one field with `HEXISTS`.
- Avoid rewriting the complete profile for a small update.

Disadvantages:

- Values are stored and returned as strings.
- Nested objects and arrays must usually be serialized separately.
- Retrieving many fields can require `HGETALL` or `HMGET`.

## Which one should you use?

Use a JSON string when:

- You normally read and write the complete object.
- The object contains nested objects or arrays.
- The Redis value is a cached copy of an API or database response.
- Individual field updates are uncommon.

Use a Redis hash when:

- You frequently read or update individual fields.
- The object is mostly flat.
- You want commands such as `HGET`, `HSET`, `HDEL`, and `HEXISTS`.
- Rewriting the complete object for every small change is unnecessary.

Examples:

| Situation | Suggested format |
|---|---|
| Cache a complete API response | JSON string |
| Cache a nested product document | JSON string |
| Frequently update user status | Redis hash |
| Read only a user's email | Redis hash |
| Store a flat user profile | Redis hash |
| Store arrays and nested preferences | JSON string |

## Important key-type issue in this project

The current JSON and hash routes both use:

```txt
user:<id>
```

Redis keys have a specific data type.

If this command creates `user:1` as a string:

```js
redisClient.set('user:1', JSON.stringify(userData));
```

you cannot use hash commands on the same key:

```js
redisClient.hset('user:1', userData);
```

Redis may return:

```txt
WRONGTYPE Operation against a key holding the wrong kind of value
```

While comparing both approaches, use different IDs:

```txt
JSON example: user:1
Hash example: user:2
```

An even clearer implementation would use different key prefixes:

```txt
user:json:1
user:hash:1
```

## Nested objects in hashes

Redis hashes are best for flat objects.

This nested object cannot be stored directly as multiple nested Redis hash fields:

```json
{
  "name": "Deepthi",
  "address": {
    "city": "Bengaluru",
    "country": "India"
  }
}
```

One option is to serialize the nested field:

```js
await redisClient.hset('user:1', {
  name: 'Deepthi',
  address: JSON.stringify({
    city: 'Bengaluru',
    country: 'India',
  }),
});
```

Then parse `address` after reading it.

If the complete object is deeply nested, storing it as a JSON string may be simpler.

## Other useful hash commands

Get selected fields:

```js
const [name, email] = await redisClient.hmget(
  'user:1',
  'name',
  'email'
);
```

Get the number of fields:

```js
const fieldCount = await redisClient.hlen('user:1');
```

Increment a numeric field:

```js
await redisClient.hincrby('user:1', 'loginCount', 1);
```

Get all field names:

```js
const fields = await redisClient.hkeys('user:1');
```

Get all values:

```js
const values = await redisClient.hvals('user:1');
```

## Current API summary

Store complete profile as JSON:

```txt
POST /user/:id/json
```

Read complete JSON profile:

```txt
GET /user/:id/json
```

Store profile as a Redis hash:

```txt
POST /user/:id/hash
```

Read the complete Redis hash:

```txt
GET /user/:id/hash
```

## Summary

- `SET` stores the complete serialized object as one string.
- `GET` retrieves the complete JSON string.
- `HSET` creates or updates individual hash fields.
- `HGETALL` retrieves the complete hash.
- `HGET` retrieves one field.
- `HDEL` deletes selected fields.
- `HEXISTS` checks whether a field exists.
- JSON strings are convenient for complete or nested objects.
- Redis hashes are convenient for flat objects with frequent field-level access.