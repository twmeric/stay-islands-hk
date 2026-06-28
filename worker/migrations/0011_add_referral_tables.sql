-- Referral Module: tables for partner sharing program

CREATE TABLE IF NOT EXISTS referrers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  referral_code TEXT UNIQUE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  total_referrals INTEGER NOT NULL DEFAULT 0,
  total_commission INTEGER NOT NULL DEFAULT 0,
  paid_commission INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS referral_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  referrer_id INTEGER NOT NULL REFERENCES referrers(id) ON DELETE CASCADE,
  order_amount INTEGER NOT NULL,
  commission_amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'HKD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'paid', 'cancelled')),
  paid_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS referral_settings (
  id INTEGER PRIMARY KEY CHECK(id = 1),
  rules TEXT NOT NULL DEFAULT '{"mode":"percentage","percentage":5,"fixed_amount":0,"currency":"HKD"}',
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Seed default settings
INSERT OR IGNORE INTO referral_settings (id, rules) VALUES (1, '{"mode":"percentage","percentage":5,"fixed_amount":0,"currency":"HKD"}');

ALTER TABLE bookings ADD COLUMN referral_code TEXT;

CREATE INDEX IF NOT EXISTS idx_referrers_code ON referrers(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrers_token ON referrers(token);
CREATE INDEX IF NOT EXISTS idx_referrers_status ON referrers(status);
CREATE INDEX IF NOT EXISTS idx_referral_orders_booking_id ON referral_orders(booking_id);
CREATE INDEX IF NOT EXISTS idx_referral_orders_referrer_id ON referral_orders(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_orders_status ON referral_orders(status);
CREATE INDEX IF NOT EXISTS idx_bookings_referral_code ON bookings(referral_code);
