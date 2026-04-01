const db = require('../db/database');

function findAll() {
  return db.prepare('SELECT * FROM services ORDER BY id').all();
}

function findById(id) {
  return db.prepare('SELECT * FROM services WHERE id = ?').get(id);
}

module.exports = { findAll, findById };
