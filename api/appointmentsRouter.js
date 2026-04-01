const express = require('express');
const appointmentModel = require('../models/appointmentModel');
const bookingService = require('../services/bookingService');
const twilioService = require('../services/twilioService');
const availabilityService = require('../services/availabilityService');
const serviceModel = require('../models/serviceModel');

const router = express.Router();

const VALID_STATUSES = ['confirmed', 'cancelled', 'completed', 'no_show'];

// GET /api/appointments
router.get('/', (req, res) => {
  const { date, status, search, page, limit } = req.query;
  const result = appointmentModel.findAll({
    date, status, search,
    page: parseInt(page || '1', 10),
    limit: parseInt(limit || '20', 10),
  });
  res.json(result);
});

// GET /api/appointments/:id
router.get('/:id', (req, res) => {
  const appt = appointmentModel.findById(parseInt(req.params.id, 10));
  if (!appt) return res.status(404).json({ error: 'Introuvable' });
  res.json(appt);
});

// POST /api/appointments (création manuelle)
router.post('/', (req, res) => {
  const { phone, name, service_id, appt_date, appt_time, notes } = req.body;
  if (!phone || !service_id || !appt_date || !appt_time) {
    return res.status(400).json({ error: 'Champs manquants : phone, service_id, appt_date, appt_time.' });
  }

  const result = bookingService.create({
    phone: `whatsapp:${phone.replace(/\s/g, '')}`,
    name, service_id: parseInt(service_id, 10), appt_date, appt_time, notes,
  });

  if (!result.ok) return res.status(422).json({ error: result.reason });
  res.status(201).json(result.appointment);
});

// PATCH /api/appointments/:id
router.patch('/:id', async (req, res) => {
  const { status } = req.body;
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Statut invalide. Valeurs : ${VALID_STATUSES.join(', ')}` });
  }

  const appt = appointmentModel.findById(parseInt(req.params.id, 10));
  if (!appt) return res.status(404).json({ error: 'Introuvable' });

  const updated = appointmentModel.updateStatus(appt.id, status);

  // Notifier le client par WhatsApp
  const messages = {
    cancelled: `❌ Votre rendez-vous du ${appt.appt_date} à ${appt.appt_time} (${appt.service_name}) a été annulé.`,
    completed: `✅ Merci pour votre visite ! Rendez-vous ${appt.appt_date} – ${appt.service_name}. À bientôt !`,
    confirmed: `✅ Votre rendez-vous du ${appt.appt_date} à ${appt.appt_time} est confirmé.`,
  };

  if (messages[status] && appt.phone) {
    twilioService.sendMessage(appt.phone, messages[status]).catch(() => {});
  }

  res.json(updated);
});

// DELETE /api/appointments/:id (soft delete)
router.delete('/:id', async (req, res) => {
  const result = bookingService.cancel(parseInt(req.params.id, 10));
  if (!result.ok) return res.status(422).json({ error: result.reason });

  if (result.appointment.phone) {
    const a = result.appointment;
    twilioService.sendMessage(
      a.phone,
      `❌ Votre rendez-vous du ${a.appt_date} à ${a.appt_time} a été annulé.`
    ).catch(() => {});
  }

  res.json(result.appointment);
});

// GET /api/availability
router.get('/availability/slots', (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'Paramètre date requis.' });
  res.json(availabilityService.getSlots(date));
});

// GET /api/services
router.get('/services/list', (req, res) => {
  res.json(serviceModel.findAll());
});

module.exports = router;
