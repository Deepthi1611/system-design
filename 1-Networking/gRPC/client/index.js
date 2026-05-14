const express = require('express');
const bodyParser = require('body-parser');
const client = require('./client');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

app.listen(PORT, () => {
  console.log(`HTTP server running at http://localhost:${PORT}`);
});

app.get('/', (req, res) => {
  client.getAll(null, (err, response) => {
    if (err) {
      console.error('Error fetching all customers:', err);
      res.status(500).send('Error fetching customers');
    } else {
      res.json(response);
    }
  });
});

app.post('/create', (req, res) => {
});

app.post('/update', (req, res) => { });

app.post('/remove', (req, res) => { });