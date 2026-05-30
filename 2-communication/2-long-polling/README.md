# Long Polling

Long polling is a client-server communication pattern where the client asks the server for data, but the server does not respond immediately if there is no new data.

Instead, the server keeps the request open until new data is available. After the client receives a response, it immediately starts another request.

This gives a near real-time update experience while still using normal HTTP requests.

## How it works

1. The browser sends a request with the latest version it already has.
2. The server checks whether newer data exists.
3. If newer data exists, the server responds immediately.
4. If nothing changed, the server keeps the request pending.
5. When data changes, the server responds to all waiting clients.
6. The browser updates the UI and starts the next long-poll request.

## Version tracking

This example tracks changes using a `version` number:

```js
let data = {
  version: 1,
  message: 'Hello, this is the initial long polling data!',
};
```

The browser stores the latest version it has received:

```js
let lastVersion = 0;
```

Then it sends that version to the server:

```js
fetch(`/data?lastVersion=${lastVersion}`);
```

If the browser has version `1` and the server also has version `1`, the server knows there is no new data yet, so it keeps the request open.

## Waiting clients

The server stores pending responses in an array:

```js
const waitingClients = [];
```

When a request arrives and there is no newer data, the server does this:

```js
waitingClients.push(res);
```

That means the HTTP request stays pending instead of completing immediately.

## Updating data

The UI has an **Update Server Data** button.

When clicked, the browser calls:

```txt
GET /update-data
```

The server increments the version and updates the message:

```js
data = {
  version: data.version + 1,
  message: 'Data has been updated at ' + new Date().toISOString(),
};
```

Then it responds to every waiting client:

```js
while (waitingClients.length > 0) {
  const clientResponse = waitingClients.pop();
  clientResponse.json(data);
}
```

After the browser receives the update, it saves the new version:

```js
lastVersion = data.version;
```

Then it starts the next long-poll request.

## Preventing duplicate polling loops

The browser uses `isPolling`:

```js
let isPolling = false;
```

This prevents multiple active polling loops from being created by repeated button clicks.

If a request is already running, `fetchData()` exits early:

```js
if (isPolling) {
  return;
}
```

## What you see in the Network tab

With long polling, you should not see continuous completed requests when data has not changed.

Instead, you should usually see one `/data` request in a pending state. When the data is updated, that request completes, the UI updates, and the browser starts one new pending `/data` request.

## Advantages

- More efficient than short polling when updates are infrequent.
- Provides faster updates than fixed-interval polling.
- Works over regular HTTP.

## Disadvantages

- Server must keep requests open.
- Requires careful cleanup when clients disconnect.
- More complex than short polling.

## When to use

Long polling is useful when:

- Data changes occasionally.
- The client should receive updates quickly.
- WebSockets are not needed or not available.

Examples include notifications, chat message updates, order status updates, and live dashboards with moderate update frequency.
