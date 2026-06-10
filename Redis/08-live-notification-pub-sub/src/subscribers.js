import {Redis} from 'ioredis';

const subscriber = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Subscribe to the 'notifications' channel
subscriber.subscribe('notifications', (err, count) => {
  if (err) {
    console.error('Failed to subscribe: %s', err.message);
  } else {
    console.log(`Subscribed successfully! This client is currently subscribed to ${count} channels.`);
  }
});

// Listen for messages on the subscribed channel
subscriber.on('message', (channel, message) => {
  console.log(`Received message from channel ${channel}: ${JSON.parse(message)}`);
});