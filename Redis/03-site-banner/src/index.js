const express = require('express');
const redis = require('ioredis');

// create express app
const app = express();
// body parser middleware
app.use(express.json());

// create redis client
const client = new redis(process.env.REDIS_URL || 'redis://localhost:6379');

// these keys can also be stored in another file which contain all constants
const BANNER_KEY = 'app-banner';

// set banner message in redis
app.post('/banner', async (req, res) => {
    await client.set(BANNER_KEY, req.body.message || "welcome to redis banner demo" );
    res.status(201).json({ message: 'Banner updated' });
});

// get banner message from redis
app.get('/banner', async (req, res) => {
    const banner = await client.get(BANNER_KEY) || "welcome to redis banner demo";
    res.json({ banner });
});

// delete banner message from redis
app.delete('/banner', async (req, res) => {
    await client.del(BANNER_KEY);
    res.json({ message: 'Banner deleted' });
});

// check if banner exists in redis
app.get('/banner-exists/:key', async (req, res) => {
    console.log(req.params.key, typeof req.params.key);
    const exists = await client.exists(req.params.key);
    console.log(exists);
    res.json({ exists: !!exists });
});

// start the server
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});