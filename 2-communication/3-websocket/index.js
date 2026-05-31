const express = require('express');
const http = require('node:http');
const path = require('node:path');
// importing the Server class from the socket.io package
const { Server } = require('socket.io');

const app = express();
// In an Express-only app, app.listen(PORT) is enough because Express
// creates the HTTP server internally. Here we create it ourselves so
// Socket.IO can attach to the same server as the Express app.
const server = http.createServer(app);
// Creating a new instance of the Socket.IO server and attaching it to the HTTP server
const io = new Server(server);
const PORT = 3000;

const messages = [];

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Listening for new client connections to the Socket.IO server
io.on('connection', (socket) => {
  console.log('Client connected');

  // When a new client connects, we send them the current chat history
  socket.emit('chat:history', messages);

  // Listening for 'chat:message' events from the client. 
  // When a message is received, we process it and broadcast it to all connected clients
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

    // Broadcasting the new chat message to all connected clients using io.emit()
    io.emit('chat:message', chatMessage);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
