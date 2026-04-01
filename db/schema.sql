CREATE TABLE IF NOT EXISTS clients (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  phone      TEXT    NOT NULL UNIQUE,
  name       TEXT,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS services (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT    NOT NULL,
  duration_min INTEGER NOT NULL,
  price_cents  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS appointments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id   INTEGER NOT NULL REFERENCES clients(id),
  service_id  INTEGER NOT NULL REFERENCES services(id),
  appt_date   TEXT    NOT NULL,
  appt_time   TEXT    NOT NULL,
  status      TEXT    NOT NULL DEFAULT 'confirmed',
  notes       TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_appt_date   ON appointments(appt_date);
CREATE INDEX IF NOT EXISTS idx_appt_client ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appt_status ON appointments(status);

INSERT OR REPLACE INTO services (id, name, duration_min, price_cents) VALUES
  (1, 'Coupe + bouc moustache', 30,  3500),
  (2, 'Coupe',                  30,  3000),
  (3, 'Coupe -18ans',           30,  2500),
  (4, 'Coupe + barbe',          45,  4000);
