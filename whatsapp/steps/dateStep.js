const chrono = require('chrono-node');
const availabilityService = require('../../services/availabilityService');
const sessionStore = require('../sessionStore');

function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

function handle(phone, body) {
  const parsed = chrono.fr.parseDate(body, new Date(), { forwardDate: true });

  if (!parsed) {
    return 'Date non reconnue. Essayez par exemple : "15/04", "demain", "lundi prochain".';
  }

  const now = new Date();
  if (parsed < now) {
    return 'Cette date est déjà passée. Choisissez une date future.';
  }

  const maxDate = new Date(now);
  maxDate.setDate(maxDate.getDate() + 30);
  if (parsed > maxDate) {
    return 'Les réservations sont limitées à 30 jours. Choisissez une date plus proche.';
  }

  const dateStr = toISODate(parsed);
  const slots = availabilityService.getSlots(dateStr);

  if (slots.length === 0) {
    return `Aucun créneau disponible le ${dateStr}. Essayez une autre date.`;
  }

  const list = slots.map((s, i) => `${i + 1}. ${s.label}`).join('\n');
  sessionStore.set(phone, 'AWAITING_TIME', { appt_date: dateStr });

  return `Créneaux disponibles le ${dateStr} :\n${list}\n\nRépondez avec le numéro du créneau.`;
}

module.exports = { handle };
