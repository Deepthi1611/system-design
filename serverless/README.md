# Serverless Basic App

This folder contains a small application built with the Serverless Framework and Node.js.

## What Serverless Means

“Serverless” does not mean there are no servers. It means you do not manage the servers yourself.
Instead, you write small functions, deploy them to a cloud provider such as AWS Lambda, and the platform
handles provisioning, scaling, and execution for you.

With the Serverless Framework, you describe your application in a configuration file, then deploy it
as a set of cloud functions and API endpoints.

## What This App Does

This example has two functions:

1. `hello`
   - Returns a friendly JSON response.
   - Demonstrates a simple HTTP-triggered Lambda function.

2. `time`
   - Returns the current UTC timestamp.
   - Shows how a function can compute and return dynamic data.

Both functions are exposed through HTTP API routes:

- `GET /hello`
- `GET /time`

## File Overview

### `package.json`

This file defines the Node.js project and the scripts used to work with Serverless Framework.

- `start` runs the app locally with `serverless offline`
- `deploy` deploys the service to AWS
- `remove` removes the deployed service
- `logs` streams logs for the `hello` function

It also lists the local development dependencies:

- `serverless`
- `serverless-offline`

### `serverless.yml`

This is the main Serverless Framework configuration file.

It defines:

- the service name: `basic-serverless-app`
- the AWS runtime: `nodejs20.x`
- the deployment stage: `dev`
- the AWS region: `us-east-1`
- environment variables shared by the functions
- the two Lambda functions and their HTTP routes

The `serverless-offline` plugin lets you run and test the app locally without deploying to AWS.

### `handler.js`

This file contains the actual business logic for the Lambda functions.

It includes:

- a small `buildResponse` helper to standardize JSON responses
- the `hello` function, which returns a greeting
- the `time` function, which returns the current UTC time

## How It Works

1. A request comes in to `/hello` or `/time`.
2. Serverless Framework maps that route to the correct Lambda function.
3. AWS Lambda executes the handler in `handler.js`.
4. The handler returns a JSON response.
5. API Gateway or HTTP API sends the response back to the client.

## Local Run

From inside this folder:

```bash
npm install
npm start
```

Then open the local endpoints shown by `serverless-offline`, usually something like:

- `GET http://localhost:3000/hello`
- `GET http://localhost:3000/time`

## Deploying to AWS

Before deploying, make sure you have:

- an AWS account
- AWS credentials configured locally
- the Serverless Framework CLI available through `npx` or installed globally

Then run:

```bash
npm install
npm run deploy
```

Serverless Framework will package the code, create the Lambda functions, create the HTTP API routes,
and deploy everything to AWS.

## Why This Pattern Is Useful

This approach is good for:

- small APIs
- event-driven workloads
- prototypes
- workloads that should scale automatically

It keeps the codebase simple because you only write the logic for each function and describe the
infrastructure in a single configuration file.
