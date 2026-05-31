# WebSocket

WebSocket is a communication protocol that keeps a persistent two-way connection open between the browser and the server.

Unlike short polling or long polling, the browser does not need to repeatedly ask the server for updates. Once the WebSocket connection is open, either side can send data whenever it has something new.

## Example in this folder

This project implements a simple chat application with Socket.IO.

- `index.js` starts an Express server and a Socket.IO server.
- `index.html` opens a Socket.IO connection from the browser.
- Messages typed in the input are sent to the server.
- The server broadcasts each message to every connected browser.
- The page shows messages at the top and keeps the input box with the send button at the bottom.

## How the server works

The server creates a normal HTTP server:

```js
const server = http.createServer(app);
```

Then it attaches a Socket.IO server to the same HTTP server:

```js
const io = new Server(server);
```

When a browser connects, the server listens for messages:

```js
io.on('connection', (socket) => {
  socket.on('chat:message', (rawMessage) => {
    // broadcast message
  });
});
```

Each message is broadcast to all connected clients:

```js
io.emit('chat:message', chatMessage);
```

## How the browser works

The browser loads the Socket.IO client script:

```js
<script src="/socket.io/socket.io.js"></script>
```

Then it creates a Socket.IO connection:

```js
const socket = io();
```

When the form is submitted, the browser sends the input value:

```js
socket.emit('chat:message', text);
```

When a message arrives from the server, the browser adds it to the chat window.

## What you see in the Network tab

You should see one WebSocket connection instead of repeated HTTP requests.

Messages travel through that open connection, so the Network tab will not show a new request for every chat update the same way polling does.

## When to use

WebSockets are useful when both client and server need fast, continuous communication.

Examples include chat apps, multiplayer games, collaborative editing, notifications, and live dashboards.
