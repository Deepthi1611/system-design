const express = require('express');
const http = require('node:http');
const path = require('path');
// importing the Server class from the socket.io package
const { Server } = require('socket.io');

const app = express();
// In an Express-only app, app.listen(PORT) is enough because Express
// creates the HTTP server internally. Here we create it ourselves so
// Socket.IO can attach to the same server as the Express app.
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

const messages = [];

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.emit('chat:history', messages);

  socket.on('chat:message', (rawMessage) => {
    const text = String(rawMessage).trim();

    if (!text) {
      return;
    }

    const chatMessage = {
      type: 'message',
      text,
      sentAt: new Date().toISOString(),
    };

    messages.push(chatMessage);

    if (messages.length > 50) {
      messages.shift();
    }

    io.emit('chat:message', chatMessage);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
