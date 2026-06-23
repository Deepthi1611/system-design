import {kafka} from './client.js';

async function init() {
    const producer = kafka.producer();
    await producer.connect();
    console.log('producer connected');

    await producer.send({
        topic: 'rider-updates',
        // partition is 0 for north and 1 for south
        messages: [
            { partition: 1, key: 'driver-name', value: 'South' },
        ],
    });
    console.log('message sent to topic rider-updates');

    await producer.disconnect();
    console.log('producer disconnected');
}

init();