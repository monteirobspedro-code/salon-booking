require('dotenv').config();
const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const FROM = process.env.TWILIO_WHATSAPP_FROM;

async function sendMessage(to, body) {
  return client.messages.create({ from: FROM, to, body });
}

module.exports = { sendMessage };
