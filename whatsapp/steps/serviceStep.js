const serviceModel = require('../../models/serviceModel');
const sessionStore = require('../sessionStore');

function handle(phone, body) {
  const services = serviceModel.findAll();
  const index = parseInt(body.trim(), 10) - 1;

  if (isNaN(index) || index < 0 || index >= services.length) {
    const list = services.map((s, i) => `${i + 1}. ${s.name}`).join('\n');
    return `Choix invalide. Veuillez répondre avec un numéro :\n${list}`;
  }

  const service = services[index];
  sessionStore.set(phone, 'AWAITING_DATE', { service_id: service.id, service_name: service.name });

  return `Vous avez choisi : *${service.name}*\n\nQuelle date souhaitez-vous ? (ex: 15/04, demain, lundi prochain)`;
}

module.exports = { handle };
