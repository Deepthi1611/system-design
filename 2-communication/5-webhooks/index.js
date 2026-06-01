const express = require('express');

const app = express();
const PORT = 3000;

// Webhook providers usually send JSON payloads in the request body.
// This parser lets Express read req.body for JSON requests.
app.use(express.json());

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.get('/', (req, res) => {
  res.json({
    message: 'Webhook demo server is running',
    note: 'Actual webhook processing is not implemented yet.',
  });
});

// Placeholder webhook endpoint.
// In a real implementation, this route would verify the webhook signature,
// validate the payload, and trigger application-specific logic.

// endpoint for receiving webhooks
app.post('/webhook', (req, res) => {
  console.log('Received webhook request', req.body);

  res.status(200).json({
    message: 'Webhook received',
    note: 'No webhook processing has been implemented yet.',
  });
});
