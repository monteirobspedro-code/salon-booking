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

const PORT = process.env.PORT;
if (!PORT) {
  console.error('ERROR: process.env.PORT is not set');
  process.exit(1);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on 0.0.0.0:${PORT}`);
  console.log(`Health: http://0.0.0.0:${PORT}/health`);
  console.log(`Webhook: http://0.0.0.0:${PORT}/webhook`);
});
