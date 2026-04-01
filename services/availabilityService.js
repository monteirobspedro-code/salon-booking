const appointmentModel = require('../models/appointmentModel');

const OPENING = parseInt(process.env.SALON_OPENING_HOUR || '9', 10);
const CLOSING = parseInt(process.env.SALON_CLOSING_HOUR || '18', 10);
const SLOT_MIN = parseInt(process.env.SALON_SLOT_MINUTES || '30', 10);

function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function getSlots(date) {
  const confirmed = appointmentModel.findByDate(date)
    .filter(a => a.status !== 'cancelled');

  // Build a set of all minutes blocked by existing appointments
  const blockedMinutes = new Set();
  for (const appt of confirmed) {
    const start = timeToMinutes(appt.appt_time);
    const duration = appt.duration_min || SLOT_MIN;
    for (let t = start; t < start + duration; t += SLOT_MIN) {
      blockedMinutes.add(t);
    }
  }

  const slots = [];
  const openingMins = OPENING * 60;
  const closingMins = CLOSING * 60;
  for (let t = openingMins; t < closingMins; t += SLOT_MIN) {
    if (!blockedMinutes.has(t)) {
      const label = minutesToTime(t);
      slots.push({ label, value: label });
    }
  }
  return slots;
}

module.exports = { getSlots };
