const serviceModel = require('../../models/serviceModel');
const sessionStore = require('../sessionStore');

function formatPrice(cents) {
  return (cents / 100).toFixed(2).replace('.', '.') + ' CHF';
}

function handle(phone) {
  const services = serviceModel.findAll();
  const list = services.map((s, i) =>
    `${i + 1}. ${s.name} – ${s.duration_min} min – ${formatPrice(s.price_cents)}`
  ).join('\n');

  sessionStore.set(phone, 'AWAITING_SERVICE');

  return `Bonjour ! 👋 Bienvenue au salon.\n\nNos services :\n${list}\n\nRépondez avec le numéro du service souhaité.`;
}

module.exports = { handle };
