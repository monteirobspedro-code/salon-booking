const express = require('express');
const twilio = require('twilio');
const conversationHandler = require('./conversationHandler');

const router = express.Router();

// Rate limiting per phone number
const rateLimitMap = new Map();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 1000;

function isRateLimited(phone) {
  const now = Date.now();
  const entry = rateLimitMap.get(phone) || { count: 0, windowStart: now };

  if (now - entry.windowStart > RATE_WINDOW_MS) {
    entry.count = 1;
    entry.windowStart = now;
  } else {
    entry.count++;
  }

  rateLimitMap.set(phone, entry);
  return entry.count > RATE_LIMIT;
}

// Twilio signature validation middleware
function validateTwilio(req, res, next) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const signature = req.headers['x-twilio-signature'];
  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

  if (authToken && signature) {
    const valid = twilio.validateRequest(authToken, signature, url, req.body);
    if (!valid) return res.status(403).send('Forbidden');
  }
  next();
}

router.post('/', validateTwilio, (req, res) => {
  const from = req.body.From || '';
  const body = (req.body.Body || '').slice(0, 500).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '');

  if (!from || !body) {
    return res.set('Content-Type', 'text/xml').send('<Response/>');
  }

  if (isRateLimited(from)) {
    return res.set('Content-Type', 'text/xml').send('<Response/>');
  }

  const reply = conversationHandler.handle(from, body);

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response><Message>${reply.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Message></Response>`;

  res.set('Content-Type', 'text/xml').send(twiml);
});

module.exports = router;
