const db = require('../db/database');

const WITH_DETAILS = `
  SELECT a.*, c.phone, c.name AS client_name, s.name AS service_name,
         s.duration_min, s.price_cents
  FROM appointments a
  JOIN clients c ON c.id = a.client_id
  JOIN services s ON s.id = a.service_id
`;

function create({ client_id, service_id, appt_date, appt_time, notes }) {
  const result = db.prepare(
    `INSERT INTO appointments (client_id, service_id, appt_date, appt_time, notes)
     VALUES (?, ?, ?, ?, ?)`
  ).run(client_id, service_id, appt_date, appt_time, notes || null);
  return findById(result.lastInsertRowid);
}

function findById(id) {
  return db.prepare(`${WITH_DETAILS} WHERE a.id = ?`).get(id);
}

function findByDate(date) {
  return db.prepare(`${WITH_DETAILS} WHERE a.appt_date = ? ORDER BY a.appt_time`).all(date);
}

function findByClientPhone(phone) {
  return db.prepare(
    `${WITH_DETAILS} WHERE c.phone = ? AND a.status = 'confirmed' AND a.appt_date >= date('now')
     ORDER BY a.appt_date, a.appt_time`
  ).all(phone);
}

function findAll({ date, status, search, page = 1, limit = 20 } = {}) {
  let where = [];
  let params = [];

  if (date) { where.push("a.appt_date = ?"); params.push(date); }
  if (status) { where.push("a.status = ?"); params.push(status); }
  if (search) {
    where.push("(c.name LIKE ? OR c.phone LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const total = db.prepare(
    `SELECT COUNT(*) AS n FROM appointments a JOIN clients c ON c.id = a.client_id ${whereClause}`
  ).get(...params).n;

  const data = db.prepare(
    `${WITH_DETAILS} ${whereClause} ORDER BY a.appt_date DESC, a.appt_time DESC LIMIT ? OFFSET ?`
  ).all(...params, limit, offset);

  return { data, meta: { total, page, limit } };
}

function updateStatus(id, status) {
  db.prepare(
    `UPDATE appointments SET status = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(status, id);
  return findById(id);
}

function isSlotTaken(appt_date, appt_time) {
  return !!db.prepare(
    `SELECT 1 FROM appointments WHERE appt_date = ? AND appt_time = ? AND status = 'confirmed'`
  ).get(appt_date, appt_time);
}

function getStats(date) {
  const today = date || new Date().toISOString().slice(0, 10);
  const todayCount = db.prepare(
    `SELECT COUNT(*) AS n FROM appointments WHERE appt_date = ?`
  ).get(today).n;
  const byStatus = db.prepare(
    `SELECT status, COUNT(*) AS n FROM appointments WHERE appt_date = ? GROUP BY status`
  ).all(today);
  const revenue = db.prepare(
    `SELECT COALESCE(SUM(s.price_cents), 0) AS total
     FROM appointments a JOIN services s ON s.id = a.service_id
     WHERE a.appt_date = ? AND a.status = 'confirmed'`
  ).get(today).total;

  const statusMap = {};
  byStatus.forEach(r => { statusMap[r.status] = r.n; });

  return {
    todayCount,
    confirmedCount: statusMap.confirmed || 0,
    cancelledCount: statusMap.cancelled || 0,
    completedCount: statusMap.completed || 0,
    revenue,
  };
}

module.exports = {
  create, findById, findByDate, findByClientPhone,
  findAll, updateStatus, isSlotTaken, getStats,
};
