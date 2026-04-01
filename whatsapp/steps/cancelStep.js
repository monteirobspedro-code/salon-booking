const appointmentModel = require('../../models/appointmentModel');
const bookingService = require('../../services/bookingService');
const sessionStore = require('../sessionStore');

function handleKeyword(phone) {
  const appts = appointmentModel.findByClientPhone(phone);

  if (appts.length === 0) {
    sessionStore.reset(phone);
    return 'Aucun rendez-vous à venir à annuler.';
  }

  const list = appts.map((a, i) =>
    `${i + 1}. ${a.service_name} – ${a.appt_date} à ${a.appt_time} (Réf #${a.id})`
  ).join('\n');

  sessionStore.set(phone, 'AWAITING_CANCEL_CONFIRM', { cancel_appts: appts.map(a => a.id) });

  return `Vos rendez-vous à venir :\n${list}\n\nRépondez avec le numéro à annuler, ou *RETOUR* pour continuer.`;
}

function handleConfirm(phone, body, session) {
  if (body.trim().toUpperCase() === 'RETOUR') {
    sessionStore.reset(phone);
    return 'Annulation abandonnée. Envoyez un message pour réserver.';
  }

  const index = parseInt(body.trim(), 10) - 1;
  const ids = session.data.cancel_appts || [];

  if (isNaN(index) || index < 0 || index >= ids.length) {
    return `Numéro invalide. Répondez avec un numéro entre 1 et ${ids.length}, ou *RETOUR*.`;
  }

  const result = bookingService.cancel(ids[index]);
  sessionStore.reset(phone);

  if (!result.ok) return `❌ ${result.reason}`;
  return `✅ Rendez-vous #${result.appointment.id} annulé avec succès.`;
}

module.exports = { handleKeyword, handleConfirm };
