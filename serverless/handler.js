'use strict';

const buildResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
});

module.exports.hello = async () => {
  return buildResponse(200, {
    message: 'Hello from Serverless Framework!',
    app: process.env.APP_NAME,
  });
};

module.exports.time = async () => {
  return buildResponse(200, {
    message: 'Current server time',
    utcTime: new Date().toISOString(),
  });
};
