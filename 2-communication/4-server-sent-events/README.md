# Server-Sent Events

Server-Sent Events, or SSE, is a browser API that lets the server push updates to the browser over a long-lived HTTP connection.

The browser opens the connection once using `EventSource`. After that, the server can keep sending events through the same connection.

## Important idea

SSE is one-way:

```txt
Server -> Browser
```

The browser receives updates from the server, but it does not send data back through the same SSE connection. If the browser needs to update server data, it usually sends a separate normal HTTP request.

## Example in this folder

This folder implements a basic SSE stream.

- `index.js` starts an Express server.
- `index.html` opens an SSE connection using `EventSource`.
- `/sse` keeps an HTTP connection open.
- The server sends the initial data immediately.
- The server sends the latest data again every 10 seconds.

## Browser flow

The browser creates an SSE connection:

```js
const events = new EventSource('/sse');
```

This is different from `fetch()`. A normal `fetch()` expects one complete response, but an SSE connection stays open and receives multiple events over time.

The browser listens for incoming messages:

```js
events.onmessage = (event) => {
  const data = JSON.parse(event.data);

  dataElement.textContent = data.message;
  statusElement.textContent = `Last event received at ${new Date().toLocaleTimeString()}`;
};
```

Whenever the server writes an event, this `onmessage` handler runs.

## Server flow

The server exposes an SSE endpoint:

```js
app.get('/sse', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  res.write(`data: ${JSON.stringify(data)}\n\n`);
});
```

The important header is:

```txt
Content-Type: text/event-stream
```

That tells the browser this response is an SSE stream.

The server sends data in this format:

```txt
data: {"message":"Hello"}

```

The blank line after the `data:` line is important because it marks the end of one SSE message.

## Interval updates

In this example, the server writes data every 10 seconds:

```js
const intervalId = setInterval(() => {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}, 10000);
```

This still uses one open connection. It does not create a new HTTP request every 10 seconds.

When the browser tab closes or disconnects, the server clears the interval:

```js
req.on('close', () => {
  clearInterval(intervalId);
});
```

This prevents the server from continuing work for a disconnected client.

## Network tab behavior

In the Network tab, you should usually see one `/sse` request that stays pending.

That is expected. The request is not stuck; it is the open event stream. New events are delivered through that same request.

## Short Polling vs Server-Sent Events

Short polling and SSE can look similar if both use intervals, but they work differently.

Short polling means the client repeatedly asks the server for data:

```txt
Client -> Server: GET /data
Server -> Client: current data

Client waits 5 seconds

Client -> Server: GET /data
Server -> Client: current data
```

SSE means the client opens one connection, and the server pushes updates through it:

```txt
Client -> Server: GET /sse
Server -> Client: event 1
Server -> Client: event 2
Server -> Client: event 3
```

| Feature | Short Polling | Server-Sent Events |
|---|---|---|
| Browser API | `fetch()` with `setInterval()` | `EventSource` |
| Connection | New request each interval | One long-lived request |
| Who starts each update check? | Browser | Server |
| Direction | Browser asks, server responds | Server pushes to browser |
| Network tab | Many completed `/data` requests | One pending `/sse` request |
| Delay | Update is seen on the next poll | Server can push immediately |
| Best for | Simple periodic checks | Live server-to-browser updates |

## Simple mental model

Short polling:

```txt
Browser: Do you have new data?
Server: Here is the current data.
Browser: Do you have new data?
Server: Here is the current data.
```

Server-Sent Events:

```txt
Browser: I am listening.
Server: Here is an update.
Server: Here is another update.
Server: Here is another update.
```

## When to use short polling

Use short polling when simplicity matters more than real-time efficiency.

Good cases for short polling:

- Checking background job status every few seconds.
- Refreshing a dashboard where slight delay is acceptable.
- Checking payment or order status occasionally.
- Polling a report generation task.
- Checking whether a file upload or processing task is complete.
- Systems where updates are rare and not urgent.
- Simple demos or prototypes.
- Environments where keeping long-lived connections is difficult.

Example:

```txt
Every 5 seconds, ask:
"Is the report ready?"
```

Short polling is acceptable when this kind of delay is fine:

```txt
Data changes at 10:00:01
Client checks again at 10:00:05
User sees update after 4 seconds
```

## When to use SSE

SSE is useful when the server needs to push updates to the browser, but the browser does not need full two-way real-time communication.

Good cases for SSE:

- Live notifications.
- Live logs.
- Progress updates.
- Stock price updates.
- News or feed updates.
- Live dashboard metrics.
- Order tracking updates.
- Server health or status monitoring.
- Build or deployment progress streams.
- AI response streaming, where the server sends chunks of text to the browser.

Example:

```txt
Browser says:
"I am listening."

Server sends updates whenever needed:
"Progress is 20%"
"Progress is 40%"
"Progress is 80%"
"Done"
```

SSE is useful when updates should arrive as soon as the server has them:

```txt
Data changes at 10:00:01
Server immediately pushes update
User sees update at 10:00:01
```

## Choosing between them

Use short polling when the client can ask occasionally.

Use SSE when the server should push updates as they happen.

| Requirement | Better choice |
|---|---|
| Very simple implementation | Short polling |
| Updates can be delayed by a few seconds | Short polling |
| Updates should arrive quickly | SSE |
| Server mostly sends data to browser | SSE |
| Browser also needs to send frequent real-time messages | WebSockets or Socket.IO |
| You want fewer repeated HTTP requests | SSE |
| You only need to check status occasionally | Short polling |

If both browser and server need to send real-time messages to each other, WebSockets or Socket.IO are usually a better fit.
