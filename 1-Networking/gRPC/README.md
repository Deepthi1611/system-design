# gRPC Customer Service Notes

## Big Picture

This folder has two running parts:

```text
1. gRPC server
   server/index.js
   Runs on localhost:50051

2. HTTP Express server
   client/index.js
   Runs on localhost:3000
```

The request flow is:

```text
Browser / Postman / curl
        |
        | HTTP request
        v
client/index.js - Express HTTP server
        |
        | gRPC call
        v
client/client.js - gRPC client object
        |
        | talks to
        v
server/index.js - gRPC server
        |
        | reads/writes
        v
customers array
```

The browser does not directly talk to the gRPC server. The browser talks to Express, and Express talks to gRPC.

## package.json

Useful scripts:

```json
"client": "node client/index.js",
"server": "node server/index.js"
```

Run the gRPC server:

```bash
npm run server
```

Run the HTTP client wrapper:

```bash
npm run client
```

Important dependencies:

```json
"@grpc/grpc-js": "^1.14.3",
"@grpc/proto-loader": "^0.8.1",
"express": "^5.2.1",
"body-parser": "^2.2.2"
```

`@grpc/grpc-js` is the modern Node gRPC package.

`@grpc/proto-loader` loads the `.proto` file dynamically.

`express` creates the HTTP server.

`body-parser` parses JSON request bodies.

## customers.proto

This file is the shared contract between the gRPC client and gRPC server.

```proto
syntax = "proto3";
```

This says the file uses protobuf version 3.

```proto
package customer;
```

This creates a namespace called `customer`. That is why the JS code can do:

```js
grpc.loadPackageDefinition(packageDefinition).customer
```

The service:

```proto
service CustomerService {
  rpc GetAll (Empty) returns (CustomerList) {}
  rpc Get (CustomerRequestId) returns (Customer) {}
  rpc Insert (Customer) returns (Customer) {}
  rpc Update (Customer) returns (Customer) {}
  rpc Remove (CustomerRequestId) returns (Empty) {}
}
```

This declares five gRPC methods:

- `GetAll`: returns all customers
- `Get`: returns one customer by ID
- `Insert`: creates a customer
- `Update`: updates a customer
- `Remove`: deletes a customer by ID

Messages:

```proto
message Empty {}
```

Used when no input or output data is needed.

```proto
message CustomerRequestId {
  string id = 1;
}
```

Used when a method needs only an ID.

```proto
message CustomerList {
  repeated Customer customers = 1;
}
```

`repeated` means an array/list of customers.

```proto
message Customer {
  string id = 1;
  string name = 2;
  int32 age = 3;
}
```

This defines one customer object.

## server/index.js

This file starts the actual gRPC server.

Imports:

```js
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
```

`grpc` creates the server and provides gRPC status codes.

`protoLoader` reads `customers.proto`.

```js
const PROTO_PATH = './customers.proto';
```

This path works when commands are run from the `gRPC` folder.

Loading the proto:

```js
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  arrays: true
});
```

This reads the proto file into JavaScript.

```js
const customerProto = grpc.loadPackageDefinition(packageDefinition).customer;
```

This converts the loaded proto definition into usable gRPC service objects.

Because the proto file has:

```proto
package customer;
```

the JS code accesses it with:

```js
.customer
```

Creating the server:

```js
const server = new grpc.Server();
```

Temporary in-memory data:

```js
const customers = [
  { id: 1, name: 'John Doe', age: 30 },
  { id: 2, name: 'Jane Smith', age: 25 },
  { id: 3, name: 'Bob Johnson', age: 40 }
];
```

This data resets every time the server restarts.

Attaching the service:

```js
server.addService(customerProto.CustomerService.service, {
  ...
});
```

This connects the proto service `CustomerService` to real JavaScript functions.

### GetAll

```js
GetAll: (call, callback) => {
  callback(null, { customers });
}
```

Returns all customers.

The callback format is:

```js
callback(error, response);
```

So `null` means there is no error.

### Get

```js
let id = parseInt(call.request.id);
let customer = customers.find(c => c.id === id);
```

This reads the ID from the gRPC request and finds the matching customer.

If the customer exists:

```js
callback(null, customer);
```

If not:

```js
callback({
  code: grpc.status.NOT_FOUND,
  details: `Customer with id ${id} not found`
});
```

### Insert

```js
let newCustomer = call.request;
newCustomer.id = customers.length + 1;
customers.push(newCustomer);
callback(null, newCustomer);
```

This receives a new customer, assigns an ID, stores it in the array, and returns it.

### Update

```js
let updatedCustomer = call.request;
let id = parseInt(updatedCustomer.id);
let index = customers.findIndex(c => c.id === id);
```

This finds the customer by ID.

If found:

```js
customers[index] = updatedCustomer;
callback(null, updatedCustomer);
```

If not found, it returns a gRPC `NOT_FOUND` error.

### Remove

```js
let id = call.request.id;
let index = customers.findIndex(c => c.id === id);
```

This tries to find the customer by ID and remove it.

Potential fix:

```js
let id = parseInt(call.request.id);
```

The proto says ID is a string, but the initial customer IDs are numbers. Parsing keeps comparison consistent.

### Starting The gRPC Server

```js
server.bindAsync('localhost:50051', grpc.ServerCredentials.createInsecure(), (err, port) => {
  if (err) {
    console.error('Server binding error:', err);
  } else {
    server.start();
    console.log('Server running at http://localhost:50051');
  }
});
```

This binds the gRPC server to port `50051` and starts it.

`createInsecure()` means there is no TLS encryption. This is fine for local learning, but production systems should use secure credentials.

## client/client.js

This file creates the gRPC client object.

It loads the same proto file:

```js
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  arrays: true
});
```

The client needs the proto so it knows what methods exist and what request/response shapes they use.

```js
const customerProto = grpc.loadPackageDefinition(packageDefinition).customer;
```

Loads the `customer` package from the proto.

```js
const client = new customerProto.CustomerService(
  'localhost:50051',
  grpc.credentials.createInsecure()
);
```

This creates a client that talks to the gRPC server running at:

```text
localhost:50051
```

```js
module.exports = client;
```

This exports the client so `client/index.js` can call:

```js
client.GetAll(...)
client.Get(...)
client.Insert(...)
client.Update(...)
client.Remove(...)
```

## client/index.js

This file creates the HTTP API layer over the gRPC client.

Imports:

```js
const express = require('express');
const bodyParser = require('body-parser');
const client = require('./client');
```

Creates the Express server:

```js
const app = express();
const PORT = 3000;
```

Adds JSON parsing:

```js
app.use(bodyParser.json());
```

This allows POST routes to read data from `req.body`.

Starts the HTTP server:

```js
app.listen(PORT, () => {
  console.log(`HTTP server running at http://localhost:${PORT}`);
});
```

### GET /

```js
app.get('/', (req, res) => {
  client.getAll(null, (err, response) => {
    ...
  });
});
```

This calls the gRPC `GetAll` method and returns all customers as HTTP JSON.

Small naming note:

```js
client.GetAll(...)
```

is clearer because it matches the proto method name.

### GET /:id

Example:

```text
GET http://localhost:3000/1
```

Route:

```js
app.get('/:id', (req, res) => {
  const { id } = req.params;
  client.Get({ id: parseInt(id) }, (err, response) => {
    ...
  });
});
```

This reads the `id` from the URL and calls the gRPC `Get` method.

The proto says ID is a string, so this can also be:

```js
client.Get({ id }, ...)
```

### POST /create

Example request body:

```json
{
  "name": "Alice",
  "age": 28
}
```

Route:

```js
app.post('/create', (req, res) => {
  const newCustomer = req.body;
  client.Insert(newCustomer, (err, response) => {
    ...
  });
});
```

This calls the gRPC `Insert` method.

### POST /update

Example request body:

```json
{
  "id": "1",
  "name": "John Updated",
  "age": 31
}
```

Route:

```js
app.post('/update', (req, res) => {
  const updatedCustomer = req.body;
  client.Update(updatedCustomer, (err, response) => {
    ...
  });
});
```

This calls the gRPC `Update` method.

### POST /remove

Example request body:

```json
{
  "id": "1"
}
```

Route:

```js
app.post('/remove', (req, res) => {
  const { id } = req.body;
  client.Remove({ id }, (err, response) => {
    ...
  });
});
```

This calls the gRPC `Remove` method.

## How To Run

From this folder:

```bash
cd 1-Networking/gRPC
```

Start the gRPC server:

```bash
npm run server
```

In another terminal, start the Express HTTP wrapper:

```bash
npm run client
```

## How To Test

Get all customers:

```bash
curl http://localhost:3000/
```

Get one customer:

```bash
curl http://localhost:3000/1
```

Create customer:

```bash
curl -X POST http://localhost:3000/create \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","age":28}'
```

Update customer:

```bash
curl -X POST http://localhost:3000/update \
  -H "Content-Type: application/json" \
  -d '{"id":"1","name":"John Updated","age":31}'
```

Remove customer:

```bash
curl -X POST http://localhost:3000/remove \
  -H "Content-Type: application/json" \
  -d '{"id":"1"}'
```

## Important Notes

The address bar in a browser sends GET requests only. To test POST routes, use curl, Postman, Thunder Client, or browser JavaScript `fetch`.

Example:

```js
fetch('http://localhost:3000/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Alice', age: 28 })
})
  .then(res => res.json())
  .then(console.log);
```

The `.proto` file is loaded in both client and server because:

- the server loads it to know what methods it must implement
- the client loads it to know what methods it can call

You can move the repeated proto-loading logic into a shared helper file later, but both running processes still need access to the proto definition.

## What Is The Benefit Of gRPC?

In gRPC, you still handle normal application logic:

```text
request data
response data
errors
status codes
server logic
client calls
```

So gRPC does not remove the need to write business logic. You still decide what `GetAll`, `Get`, `Insert`, `Update`, and `Remove` should do.

The main benefit is that gRPC handles the communication layer between services.

With REST/Express, you manually think in terms of:

```text
URL
HTTP method
JSON body
status code
response shape
manual request parsing
manual response formatting
```

For example, in REST you might create:

```js
app.get('/customers/:id', ...)
```

and call it with:

```js
fetch('/customers/1')
```

You manually decide the URL, HTTP method, request body, and response shape.

With gRPC, you define the method contract in the proto file:

```proto
rpc Get (CustomerRequestId) returns (Customer) {}
```

Then the client can call it like a normal method:

```js
client.Get({ id: '1' }, callback);
```

Even though this looks like a normal function call, it is actually a network call.

Behind the scenes, gRPC automatically:

```text
1. Converts the JavaScript request object into binary protobuf format
2. Sends it over HTTP/2
3. Routes it to the correct server method
4. Converts the binary request back into an object on the server
5. Converts the server response into binary protobuf format
6. Sends the response back to the client
7. Converts it back into a JavaScript object for the client
8. Provides standard gRPC error/status handling
```

So this:

```js
client.Get({ id: '1' }, callback);
```

internally becomes a real network request to the gRPC server.

You do not manually do:

```text
JSON.stringify
fetch or axios call setup
HTTP URL construction
response parsing
binary serialization
HTTP/2 framing
method routing
```

## Why This Example Still Feels Manual

In this project, the flow is:

```text
Browser / Postman / curl
        |
        | HTTP
        v
Express server in client/index.js
        |
        | gRPC
        v
gRPC server in server/index.js
```

The Express layer is manual because browsers do not directly call regular gRPC services easily.

So `client/index.js` is acting like a translator:

```text
HTTP request from browser
        |
        v
Express route
        |
        v
gRPC client method call
```

For example:

```js
app.get('/:id', (req, res) => {
  client.Get({ id }, (err, response) => {
    ...
  });
});
```

This Express route is manual because it is browser-facing HTTP code.

The automatic gRPC part happens between:

```text
client/client.js
        |
        | gRPC network call
        v
server/index.js
```

In real backend systems, gRPC is commonly used like this:

```text
Service A
   |
   | gRPC
   v
Service B
```

No Express wrapper is needed when one backend service directly calls another backend service.

## When gRPC Is Useful

gRPC is especially useful for:

```text
backend-to-backend communication
microservices
high-performance internal APIs
strict service contracts
multi-language systems
streaming data
```

The `.proto` file acts as a shared contract. A Node.js service, Go service, Java service, or Python service can all use the same proto definition and communicate safely.

## REST vs gRPC

REST is usually better for:

```text
browser to backend communication
public APIs
simple CRUD APIs
easy manual testing in the browser
human-readable JSON requests and responses
```

gRPC is usually better for:

```text
backend to backend communication
microservices
internal APIs
high-performance systems
streaming
strict contracts across languages
```

So in this learning project:

```text
Express is used to make gRPC accessible from browser-friendly HTTP.
gRPC is used to show how services communicate through a proto contract.
```
