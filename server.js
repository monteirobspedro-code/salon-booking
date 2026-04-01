require('dotenv').config();
const express = require('express');
const path = require('path');

// Init DB (runs schema + seed on first start)
require('./db/database');

const app = express();

app.use(express.urlencoded({ extended: false })); // for Twilio webhooks
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/webhook', require('./whatsapp/webhookRouter'));
app.use('/api/appointments', require('./api/appointmentsRouter'));
app.use('/api/stats', require('./api/statsRouter'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Salon booking server running on http://localhost:${PORT}`);
  console.log(`Webhook Twilio : POST http://localhost:${PORT}/webhook`);
});
