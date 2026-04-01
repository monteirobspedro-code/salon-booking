const db = require('../db/database');

function upsert(phone, name) {
  db.prepare(`INSERT INTO clients (phone, name) VALUES (?, ?)
    ON CONFLICT(phone) DO UPDATE SET name = COALESCE(excluded.name, name)`
  ).run(phone, name || null);
  return db.prepare('SELECT * FROM clients WHERE phone = ?').get(phone);
}

function findByPhone(phone) {
  return db.prepare('SELECT * FROM clients WHERE phone = ?').get(phone);
}

function findById(id) {
  return db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
}

module.exports = { upsert, findByPhone, findById };
