import {kafka} from './client.js';

async function init() {
    const consumer = kafka.consumer({ groupId: 'rider-group' });
    await consumer.connect();
    console.log('consumer connected');

    await consumer.subscribe({ topic: 'rider-updates', fromBeginning: true });
    console.log('subscribed to topic rider-updates');

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            console.log(`Received message: ${message.value.toString()} on partition ${partition}`);
        },
    });
}

init();