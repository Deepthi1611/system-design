# Webhooks

Webhooks are a way for one system to notify another system when an event happens.

Instead of your application repeatedly asking another service whether something changed, the other service sends an HTTP request to your application at the moment the event occurs.

## Basic idea

Without webhooks, your server might poll another service:

```txt
Your server -> Payment provider: Did payment complete?
Payment provider -> Your server: Not yet

Your server -> Payment provider: Did payment complete?
Payment provider -> Your server: Yes
```

With webhooks, the provider calls your server:

```txt
Payment provider -> Your server: Payment completed
```

## Example in this folder

This folder currently contains a basic HTTP server only.

- `index.js` starts an Express server.
- `GET /` confirms the server is running.
- `POST /webhook` accepts a JSON request body.
- Actual webhook processing is intentionally not implemented yet.

The placeholder route is:

```js
app.post('/webhook', (req, res) => {
  console.log('Received webhook request', req.body);

  res.status(200).json({
    message: 'Webhook received',
    note: 'No webhook processing has been implemented yet.',
  });
});
```

Right now this only receives the request, logs the body, and returns success.

## What happens in this route

```js
app.post('/webhook', ...)
```

This creates an HTTP endpoint at:

```txt
POST /webhook
```

An external system can send event data to this endpoint.

```js
req.body
```

This contains the JSON payload sent by the webhook provider. It works because the server uses:

```js
app.use(express.json());
```

That middleware parses incoming JSON and puts it on `req.body`.

```js
res.status(200).json(...)
```

This tells the provider:

```txt
I received the webhook successfully.
```

Most webhook providers expect a quick `2xx` response. If they get an error or timeout, they usually retry the webhook later.

## Common webhook examples

Payments:

```txt
payment.succeeded -> mark order as paid
payment.failed -> mark order as failed
refund.created -> update refund status
```

Subscriptions:

```txt
subscription.created -> activate subscription
subscription.cancelled -> disable subscription access
invoice.payment_failed -> notify customer
```

Git hosting:

```txt
push -> trigger CI build
pull_request.opened -> run checks
deployment.completed -> update deployment status
```

Messaging and email:

```txt
email.delivered -> update delivery status
email.bounced -> mark address as invalid
message.received -> create support ticket
```

File processing:

```txt
video.transcoded -> make video available
document.signed -> update contract status
file.uploaded -> start processing workflow
```

## Complete webhook flow

A typical payment webhook flow looks like this:

```txt
1. User places an order.
2. User completes payment on a payment provider.
3. Payment provider creates a payment.succeeded event.
4. Payment provider sends POST /webhook to your server.
5. Your server receives the request.
6. Your server verifies the provider signature.
7. Your server checks whether this event was already processed - using idempotency key
8. Your server stores the event.
9. Your server returns 200 OK quickly.
10. A worker processes the event.
11. The worker updates the order as paid.
12. The worker sends confirmation email or triggers next workflow.
```

## What real webhook handling usually includes

A production webhook endpoint usually needs to:

- Verify the provider signature.
- Validate the request body.
- Check the event type.
- Ignore duplicate events safely.
- Store the received event.
- Return a quick success response.
- Process slow work asynchronously.
- Log failures for debugging and retries.

## Signature verification

Webhook URLs are public endpoints. Anyone who knows the URL can send a request to it.

Signature verification confirms that the request actually came from the expected provider.

Many providers send a signature in a request header:

```txt
Stripe-Signature: ...
X-Hub-Signature-256: ...
X-Signature: ...
```

A real webhook endpoint usually uses the provider's secret key to verify the signature before trusting the payload.

The flow is:

```txt
Receive request
Read signature header
Compute expected signature using secret
Compare received signature with expected signature
Reject request if signature is invalid
```

## Idempotency and duplicate events

Webhook providers can send the same event more than once.

This can happen when:

- Your server times out.
- Your server returns a non-2xx response.
- The provider does not receive your response.
- The provider retries as part of its delivery policy.

Your webhook processing should be idempotent. That means processing the same event multiple times should not create incorrect duplicate effects.

For example, this should not happen:

```txt
payment.succeeded received twice
Order marked paid twice
Customer receives two confirmation emails
Inventory reduced twice
```

A common solution is to store the provider event id:

```txt
event id: evt_123
```

Before processing, check whether `evt_123` has already been handled.

## Why webhooks should respond quickly

Webhook providers expect your endpoint to respond quickly.

Avoid doing slow work directly inside the webhook request, such as:

- Sending emails.
- Calling many internal services.
- Generating invoices or PDFs.
- Running long database workflows.
- Calling slow third-party APIs.

Instead, the webhook endpoint should usually:

```txt
Verify request
Store event
Push job to queue
Return 200 OK
```

Then a background worker can process the event.

## Where message queues fit

Message queues are commonly used in webhook systems when processing is slow, unreliable, or needs retries.

A queue sits between the webhook receiver and the actual business logic.

```txt
Webhook provider
  -> POST /webhook
  -> Webhook HTTP server
  -> Message queue
  -> Worker
  -> Database/email/internal services
```

The webhook endpoint stays fast because it only validates and enqueues the work.

The worker handles the heavier processing later.

## Webhook flow with a message queue

Example flow:

```txt
1. Provider sends POST /webhook.
2. Server verifies the signature.
3. Server validates the payload.
4. Server stores the raw event in the database.
5. Server publishes a job to a message queue.
6. Server returns 200 OK to the provider.
7. Worker receives the queued job.
8. Worker checks idempotency.
9. Worker performs business logic.
10. Worker marks the event as processed.
```

## Why use a queue with webhooks

Queues help when:

- Webhook processing takes longer than a few milliseconds.
- You need reliable retries.
- You want to avoid provider timeouts.
- You need to handle traffic spikes.
- You want to process events in the background.
- You want to isolate webhook receiving from business logic.
- You need workers that can scale independently.

Without a queue:

```txt
Provider -> Webhook endpoint -> slow processing -> response
```

If slow processing fails, the provider may retry the whole webhook request.

With a queue:

```txt
Provider -> Webhook endpoint -> enqueue job -> quick response
Worker -> process job -> retry if needed
```

The provider gets a fast response, and your system controls processing and retries.

## Example: payment webhook with queue

Provider sends:

```json
{
  "id": "evt_123",
  "type": "payment.succeeded",
  "data": {
    "orderId": "order_456",
    "amount": 500
  }
}
```

Webhook endpoint:

```txt
Verify signature
Store event evt_123
Publish job payment.succeeded to queue
Return 200 OK
```

Worker:

```txt
Read job from queue
Check if evt_123 is already processed
Mark order_456 as paid
Send confirmation email
Mark evt_123 as processed
```

## Example: GitHub webhook with queue

GitHub sends:

```json
{
  "event": "push",
  "repository": "system-design-repo",
  "commit": "abc123"
}
```

Webhook endpoint:

```txt
Verify GitHub signature
Store push event
Publish build job to queue
Return 200 OK
```

Worker:

```txt
Clone repository
Run tests
Build application
Update deployment status
```

This work can take minutes, so it should not happen inside the webhook HTTP request.

## Queue examples

Common queue technologies include:

- Redis with BullMQ.
- RabbitMQ.
- Apache Kafka.
- Amazon SQS.
- Google Pub/Sub.
- Azure Service Bus.

For small applications, Redis-based queues are often simple and practical.

For high-throughput event pipelines, Kafka or cloud pub/sub systems are common.

## Recommended production shape

A strong webhook architecture often looks like this:

```txt
Provider
  -> Webhook endpoint
  -> Verify signature
  -> Store raw event
  -> Enqueue job
  -> Return 200 OK

Worker
  -> Read job
  -> Check duplicate event id
  -> Process event
  -> Update database
  -> Mark event processed
  -> Retry or dead-letter on failure
```

## Testing the placeholder endpoint

You can test the placeholder endpoint with:

```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"event":"payment.succeeded","id":"evt_123"}'
```

The server should respond with:

```json
{
  "message": "Webhook received",
  "note": "No webhook processing has been implemented yet."
}
```

## Current status of this folder

This folder is intentionally only a scaffold.

It does not yet implement:

- Provider-specific signature verification.
- Database persistence.
- Idempotency checks.
- Message queue publishing.
- Background workers.
- Real business logic.
