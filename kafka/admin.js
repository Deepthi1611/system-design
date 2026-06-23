import {kafka} from './client.js';

async function init() {
    const admin = kafka.admin();
    await admin.connect();
    console.log('admin connected');

    await admin.createTopics({
        topics: [
            {
                topic: 'rider-updates',
                numPartitions: 2,
            }
        ]
    });
    console.log('topic created rider-updates');

    await admin.disconnect();
    console.log('admin disconnected');
}

init();