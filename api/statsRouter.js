const express = require('express');
const appointmentModel = require('../models/appointmentModel');

const router = express.Router();

router.get('/', (req, res) => {
  const { date } = req.query;
  res.json(appointmentModel.getStats(date));
});

module.exports = router;
