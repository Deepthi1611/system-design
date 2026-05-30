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

// This array will hold the response objects of clients that are waiting for data updates
const waitingclients = [];

// Endpoint to get the data
// here comparison is done to check if the data has changed since the last request, 
// if it has changed then it will send the new data,
//  otherwise it will not send anything (or you can choose to send a specific response indicating no change)
// in real implementation, there might be an id that need to be compared, here we are comparing data directly for simplicity
app.get('/data', (req, res) => {
    if(data !== req.query.lastData) {
        res.json(data);
    } else {
        // if data has not changed, we will keep the client waiting until there is an update
        waitingclients.push(res);
    }
});

// Endpoint to update the data
// use put for updates, using get so that we can easily test with browser
app.get('/update-data', (req, res) => {
    data = { message: 'Data has been updated at ' + new Date().toISOString() };
    // Notify all waiting clients about the data update
    while (waitingclients.length > 0) {
        const clientRes = waitingclients.pop();
        clientRes.json(data);
    }
    res.send('Data updated and clients notified');
});
