-- Local SQLite schema (Hostinger still uses sql/schema.sql / MySQL)

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user',
  status TEXT NOT NULL DEFAULT 'active',
  trial_ends_at TEXT NULL,
  paid_until TEXT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_login_at TEXT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_usdt REAL NOT NULL,
  days INTEGER NOT NULL,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  plan_id TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'demo',
  provider_payment_id TEXT NULL,
  invoice_url TEXT NULL,
  amount_usdt REAL NOT NULL,
  pay_currency TEXT NOT NULL DEFAULT 'usdttrc20',
  status TEXT NOT NULL DEFAULT 'waiting',
  raw_payload TEXT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS admin_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id INTEGER NOT NULL,
  target_user_id INTEGER NULL,
  action TEXT NOT NULL,
  meta TEXT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS activity_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NULL,
  username TEXT NULL,
  action TEXT NOT NULL,
  detail TEXT NULL,
  meta TEXT NULL,
  ip TEXT NULL,
  user_agent TEXT NULL,
  country TEXT NULL,
  region TEXT NULL,
  city TEXT NULL,
  timezone TEXT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_events(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_events(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_action ON activity_events(action);
CREATE INDEX IF NOT EXISTS idx_activity_ip ON activity_events(ip);

INSERT OR IGNORE INTO plans (id, name, price_usdt, days, active) VALUES
  ('pro30', 'Pro · 30 days', 29.00, 30, 1),
  ('pro365', 'Pro · 1 year', 199.00, 365, 1);
