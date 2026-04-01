const clientModel = require('../models/clientModel');
const appointmentModel = require('../models/appointmentModel');
const serviceModel = require('../models/serviceModel');

function create({ phone, name, service_id, appt_date, appt_time, notes }) {
  const service = serviceModel.findById(service_id);
  if (!service) return { ok: false, reason: 'Service introuvable.' };

  const now = new Date();
  const apptDateTime = new Date(`${appt_date}T${appt_time}:00`);

  if (isNaN(apptDateTime.getTime())) {
    return { ok: false, reason: 'Date ou heure invalide.' };
  }
  if (apptDateTime - now < 2 * 60 * 60 * 1000) {
    return { ok: false, reason: `Le rendez-vous doit être pris au moins 2h à l'avance.` };
  }
  const maxDate = new Date(now);
  maxDate.setDate(maxDate.getDate() + 30);
  if (apptDateTime > maxDate) {
    return { ok: false, reason: `Les réservations sont limitées à 30 jours à l'avance.` };
  }
  if (appointmentModel.isSlotTaken(appt_date, appt_time)) {
    return { ok: false, reason: 'Ce créneau est déjà pris. Choisissez un autre horaire.' };
  }

  const client = clientModel.upsert(phone, name);
  const appointment = appointmentModel.create({
    client_id: client.id, service_id, appt_date, appt_time, notes,
  });

  return { ok: true, appointment };
}

function cancel(id) {
  const appt = appointmentModel.findById(id);
  if (!appt) return { ok: false, reason: 'Rendez-vous introuvable.' };
  if (appt.status === 'cancelled') return { ok: false, reason: 'Déjà annulé.' };

  const updated = appointmentModel.updateStatus(id, 'cancelled');
  return { ok: true, appointment: updated };
}

module.exports = { create, cancel };
