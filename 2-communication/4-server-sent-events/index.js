const express = require('express');
const path = require('node:path');

const app = express();
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

let data = {
  message: 'Hello, this is the initial server-sent events data!',
};

app.get('/sse', (req, res) => {
  // Set the necessary headers to establish an SSE connection
  // Content-Type: text/event-stream tells the client to expect an SSE stream
  res.setHeader('Content-Type', 'text/event-stream');
  // Cache-Control: no-cache prevents the browser from caching the response
  res.setHeader('Cache-Control', 'no-cache');
  // Connection: keep-alive keeps the connection open for continuous updates
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send the initial data immediately when the client connects
  res.write(`data: ${JSON.stringify(data)}\n\n`);

  // Keep the connection open and send updates every 10 seconds
  const intervalId = setInterval(() => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }, 10000);

  // Clean up when the client disconnects
  req.on('close', () => {
    clearInterval(intervalId);
    console.log('Client disconnected from SSE');
  });
});
