const availabilityService = require('../../services/availabilityService');
const sessionStore = require('../sessionStore');

function handle(phone, body, session) {
  const slots = availabilityService.getSlots(session.data.appt_date);

  if (slots.length === 0) {
    sessionStore.set(phone, 'AWAITING_DATE');
    return 'Plus aucun créneau disponible ce jour. Choisissez une autre date.';
  }

  const index = parseInt(body.trim(), 10) - 1;
  if (isNaN(index) || index < 0 || index >= slots.length) {
    const list = slots.map((s, i) => `${i + 1}. ${s.label}`).join('\n');
    return `Numéro invalide. Créneaux disponibles :\n${list}`;
  }

  const chosen = slots[index];
  sessionStore.set(phone, 'AWAITING_CONFIRM', { appt_time: chosen.value });

  const { service_name, appt_date } = session.data;
  return `Récapitulatif :\n• Service : ${service_name}\n• Date : ${appt_date}\n• Heure : ${chosen.label}\n\nRépondez *OUI* pour confirmer ou *NON* pour recommencer.`;
}

module.exports = { handle };
