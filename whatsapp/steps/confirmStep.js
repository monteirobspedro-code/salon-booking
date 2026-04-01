const bookingService = require('../../services/bookingService');
const sessionStore = require('../sessionStore');

function handle(phone, body, session) {
  const answer = body.trim().toUpperCase();

  if (['NON', 'N', '2', 'NO'].includes(answer)) {
    sessionStore.reset(phone);
    return 'Réservation annulée. Envoyez un message pour recommencer.';
  }

  if (!['OUI', 'O', '1', 'YES', 'Y'].includes(answer)) {
    return 'Répondez *OUI* pour confirmer ou *NON* pour annuler.';
  }

  const { service_id, appt_date, appt_time } = session.data;
  const result = bookingService.create({ phone, service_id, appt_date, appt_time });

  sessionStore.reset(phone);

  if (!result.ok) {
    return `❌ Erreur : ${result.reason}\n\nEnvoyez un message pour réessayer.`;
  }

  const a = result.appointment;
  return `✅ Rendez-vous confirmé !\n• ${a.service_name}\n• ${a.appt_date} à ${a.appt_time}\n• Réf : #${a.id}\n\nÀ bientôt !`;
}

module.exports = { handle };
