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
  // first argument is the request data, which is null in this case since we are not sending any data to the server
  // second argument is the callback function that will be called when the response is received from the server
  client.getAll(null, (err, response) => {
    if (err) {
      console.error('Error fetching all customers:', err);
      res.status(500).send('Error fetching customers');
    } else {
      res.json(response.customers);
    }
  });
});

app.get('/:id', (req, res) => {
  const { id } = req.params;
  client.Get({ id: parseInt(id) }, (err, response) => {
    if (err) {
      console.error(`Error fetching customer with id ${id}:`, err);
      res.status(500).send('Error fetching customer');
    } else {
      res.json(response);
    }
  });
});

app.post('/create', (req, res) => {
  const newCustomer = req.body;
  client.Insert(newCustomer, (err, response) => {
    if (err) {
      console.error('Error creating customer:', err);
      res.status(500).send('Error creating customer');
    } else {
      res.json(response);
    }
  });
});

app.post('/update', (req, res) => { 
  const updatedCustomer = req.body;
  client.Update(updatedCustomer, (err, response) => {
    if (err) {
      console.error('Error updating customer:', err);
      res.status(500).send('Error updating customer');
    } else {
      res.json(response);
    }
  });
});

app.post('/remove', (req, res) => { 
  const { id } = req.body;
  client.Remove({ id }, (err, response) => {
    if (err) {
      console.error('Error removing customer:', err);
      res.status(500).send('Error removing customer');
    } else {
      res.json(response);
    }
  });
});
