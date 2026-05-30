const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

let data = {
  version: 1,
  message: 'Hello, this is the initial long polling data!',
};
const waitingClients = [];

// Endpoint to get the current data.
app.get('/data', (req, res) => {
  const lastVersion = Number(req.query.lastVersion || 0);

  console.log('Received request for data', { lastVersion, currentVersion: data.version });

  if (lastVersion < data.version) {
    res.json(data);
    return;
  }

  waitingClients.push(res);

  // Handle client disconnects to prevent memory leaks.
  req.on('close', () => {
    const index = waitingClients.indexOf(res);
    if (index !== -1) {
      waitingClients.splice(index, 1);
    }
  });
});

// Endpoint to update the data.
// Using GET here so this can be tested easily from the browser.
app.get('/update-data', (req, res) => {
  data = {
    version: data.version + 1,
    message: 'Data has been updated at ' + new Date().toISOString(),
  };
  console.log('Data updated', data);

  while (waitingClients.length > 0) {
    const clientResponse = waitingClients.pop();
    clientResponse.json(data);
  }

  res.json({ message: 'Data updated successfully' });
});
