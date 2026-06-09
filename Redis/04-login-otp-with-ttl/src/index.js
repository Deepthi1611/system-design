const express = require('express');
const Redis = require('ioredis');

const app = express();
app.use(express.json());
const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

client.on('error', (error) => {
    console.error('Redis connection error:', error.message);
});

// generate a otp key for a phone number
function otpKey(phone) {
    return `otp:${phone}`;
}

app.post('/otp', async (req, res) => {
    const { phone } = req.body;
    if (!phone) {
        return res.status(400).json({ error: 'Phone number is required' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await client.set(otpKey(phone), otp, 'EX', 60); // OTP valid for 1 minute

    // In a real application, you would send the OTP via SMS here
    res.json({ message: `OTP for ${phone}: ${otp}` });
});

app.post('/otp/verify', async (req, res) => {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
        return res.status(400).json({ error: 'Phone number and OTP are required' });
    }

    const storedOtp = await client.get(otpKey(phone));
    console.log(storedOtp, 'stored otp')
    if(!storedOtp) {
        return res.status(400).json({ error: 'OTP has expired or does not exist' });
    }

    if (storedOtp === otp) {
        await client.del(otpKey(phone)); // Invalidate the OTP after successful verification
        res.json({ message: 'OTP verified successfully' });
    } else {
        res.status(400).json({ error: 'Invalid OTP' });
    }
});

// Endpoint to check OTP TTL
app.get('/otp/:phone/ttl', async (req, res) => {
    const { phone } = req.params;
    // ttl is meta data about the key, 
    // it returns the remaining time to live of a key that has a timeout.
    // but this is not the actual value of the key
    const ttl = await client.ttl(otpKey(phone));
    console.log(ttl, 'ttl')
    if (ttl === -2) {
        return res.status(404).json({ error: 'OTP not found' });
    }
    res.json({ ttl: ttl });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
