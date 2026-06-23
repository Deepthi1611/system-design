import {Kafka} from 'kafkajs';

// Create a Kafka client instance
export const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['192.168.0.106:9092']
});