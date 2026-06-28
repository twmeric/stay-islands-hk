-- Vacation packages (度假套餐) and package bookings
-- Replaces the retreat module and adds price to experiences.

-- ---------------------------------------------------------------------------
-- 1. Packages
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS packages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  name_zh TEXT,
  slug TEXT UNIQUE,
  description TEXT,
  description_zh TEXT,
  duration TEXT,
  location TEXT,
  audience TEXT,
  inclusions TEXT,       -- JSON array of strings
  itinerary TEXT,        -- JSON array of {day, title, desc}
  pricing_options TEXT,  -- JSON array of {type: 'shared'|'single', label, price, currency}
  terms TEXT,
  image_url TEXT,
  gallery TEXT,          -- JSON array of URLs
  sort_order INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at INTEGER,
  updated_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_packages_status ON packages(status);
CREATE INDEX IF NOT EXISTS idx_packages_slug ON packages(slug);
CREATE INDEX IF NOT EXISTS idx_packages_sort_order ON packages(sort_order);

-- ---------------------------------------------------------------------------
-- 2. Package Bookings
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS package_bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  package_id INTEGER NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  check_in INTEGER,
  occupancy TEXT,
  guests INTEGER DEFAULT 1,
  total_amount INTEGER,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'unpaid',
  referral_code TEXT,
  token TEXT UNIQUE,
  payment_deadline INTEGER,
  paid_at INTEGER,
  admin_notes TEXT,
  created_at INTEGER,
  updated_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_package_bookings_package_id ON package_bookings(package_id);
CREATE INDEX IF NOT EXISTS idx_package_bookings_status ON package_bookings(status);
CREATE INDEX IF NOT EXISTS idx_package_bookings_payment_status ON package_bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_package_bookings_referral_code ON package_bookings(referral_code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_package_bookings_token ON package_bookings(token) WHERE token IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 3. Update referral_orders to support package bookings
--    Need to recreate the table to make booking_id nullable and add package_booking_id.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS referral_orders_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
  package_booking_id INTEGER REFERENCES package_bookings(id) ON DELETE CASCADE,
  referrer_id INTEGER NOT NULL REFERENCES referrers(id) ON DELETE CASCADE,
  order_amount INTEGER NOT NULL,
  commission_amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'HKD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'paid', 'cancelled')),
  paid_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

INSERT INTO referral_orders_new (
  id, booking_id, package_booking_id, referrer_id, order_amount, commission_amount, currency, status, paid_at, created_at, updated_at
)
SELECT
  id, booking_id, NULL, referrer_id, order_amount, commission_amount, currency, status, paid_at, created_at, updated_at
FROM referral_orders;

DROP TABLE referral_orders;
ALTER TABLE referral_orders_new RENAME TO referral_orders;

CREATE INDEX IF NOT EXISTS idx_referral_orders_booking_id ON referral_orders(booking_id);
CREATE INDEX IF NOT EXISTS idx_referral_orders_package_booking_id ON referral_orders(package_booking_id);
CREATE INDEX IF NOT EXISTS idx_referral_orders_referrer_id ON referral_orders(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_orders_status ON referral_orders(status);

-- ---------------------------------------------------------------------------
-- 4. Remove retreat backend support
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS property_retreats;
DROP TABLE IF EXISTS retreats;

-- ---------------------------------------------------------------------------
-- 5. Add price field to experiences
-- ---------------------------------------------------------------------------
ALTER TABLE experiences ADD COLUMN price INTEGER;
