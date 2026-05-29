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

let data = { message: 'Hello, this is the Initial data you requested!' };

// Endpoint to get the data
app.get('/data', (req, res) => {
    console.log('Received request for data');
    res.json(data);
});

// Endpoint to update the data
// use put for updates, using get so that we can easily test with browser
app.get('/update-data', (req, res) => {
    data = { message: 'Data has been updated at ' + new Date().toISOString() };
    console.log('Data updated', data);
    res.json({ message: 'Data updated successfully' });
});
