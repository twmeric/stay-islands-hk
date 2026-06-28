-- =============================================================================
-- HK Maldivers — D1 SQLite Schema
-- =============================================================================
-- Target: Cloudflare D1 (SQLite)
-- Usage: wrangler d1 execute stay-islands-hk-db --local --file=./schema.sql
--        wrangler d1 execute stay-islands-hk-db --remote --file=./schema.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Properties & Room Types
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS properties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  name_zh TEXT NOT NULL,
  description TEXT,
  description_zh TEXT,
  location TEXT,
  price_per_night INTEGER NOT NULL DEFAULT 0,
  max_guests INTEGER DEFAULT 2,
  image_url TEXT,
  amenities TEXT, -- JSON array stored as TEXT
  gallery TEXT, -- JSON array of image URLs
  facilities TEXT, -- JSON array of {icon, label}
  location_details TEXT, -- JSON object {description, mapImage, nearby}
  story TEXT, -- JSON object {title, content}
  cancellation_policy TEXT, -- JSON object {rules: [{days_before, refund_percent}]}
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'draft')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS room_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_zh TEXT NOT NULL,
  description TEXT,
  description_zh TEXT,
  price_per_night INTEGER NOT NULL DEFAULT 0,
  max_guests INTEGER DEFAULT 2,
  inventory INTEGER NOT NULL DEFAULT 1,
  image_url TEXT,
  amenities TEXT, -- JSON array stored as TEXT
  bed_type TEXT, -- e.g. King / Twin / Queen
  view TEXT, -- e.g. Ocean View / Lagoon View
  size_sqm INTEGER, -- room size in square meters
  occupancy TEXT, -- e.g. 2 Adults + 1 Child
  gallery TEXT, -- JSON array of image URLs
  features TEXT, -- JSON array of feature strings
  cancellation_policy TEXT, -- JSON object {rules: [{days_before, refund_percent}]}
  status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'unavailable', 'hidden')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS experiences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  name_zh TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  description_zh TEXT,
  duration TEXT,
  group_size TEXT,
  includes TEXT, -- JSON array of strings
  price INTEGER,
  price_note TEXT,
  image_url TEXT,
  icon_name TEXT,
  sort_order INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

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
  inclusions TEXT, -- JSON array of strings
  itinerary TEXT, -- JSON array of {day, title, desc}
  pricing_options TEXT, -- JSON array of {type: 'shared'|'single', label, price, currency}
  terms TEXT,
  image_url TEXT,
  gallery TEXT, -- JSON array of URLs
  sort_order INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at INTEGER,
  updated_at INTEGER
);

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

-- -----------------------------------------------------------------------------
-- Property ↔ Experience links
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS property_experiences (
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  experience_id INTEGER NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (property_id, experience_id)
);

-- -----------------------------------------------------------------------------
-- 2. CMS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS cms_articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title_zh TEXT NOT NULL,
  content_zh TEXT NOT NULL,
  cover_image TEXT,
  category TEXT,
  tags TEXT, -- JSON array stored as TEXT
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'archived')),
  published_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- -----------------------------------------------------------------------------
-- 3. Leads
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  lead_type TEXT NOT NULL CHECK(lead_type IN ('experience_inquiry', 'island_owner_talk', 'inspiration_guide')),
  source TEXT, -- e.g. homepage, property-detail, invest-page
  status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new', 'contacted', 'qualified', 'converted', 'archived')),
  assigned_admin_id INTEGER REFERENCES admins(id) ON DELETE SET NULL,
  notes TEXT,
  metadata TEXT, -- JSON object for endpoint-specific fields (property_id, room_type_id, check_in, days, vibe, property, ip_address, user_agent, ...)
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- -----------------------------------------------------------------------------
-- 4. Bookings & Payments
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  room_type_id INTEGER NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
  check_in INTEGER NOT NULL,
  check_out INTEGER NOT NULL,
  guests INTEGER NOT NULL DEFAULT 1,
  total_amount INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'HKD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK(payment_status IN ('unpaid', 'partial', 'paid', 'refunded')),
  voucher_code TEXT,
  addons TEXT DEFAULT '[]',
  payment_method TEXT,
  payment_reference TEXT,
  payment_deadline INTEGER,
  paid_at INTEGER,
  supplier_status TEXT DEFAULT 'pending' CHECK(supplier_status IN ('pending', 'confirmed', 'rejected')),
  token TEXT,
  admin_notes TEXT,
  cancellation_reason TEXT,
  refund_amount INTEGER DEFAULT 0,
  cancelled_at INTEGER,
  confirmed_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_token ON bookings(token) WHERE token IS NOT NULL;

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  gateway TEXT NOT NULL, -- stripe, paypal, payme, fps, alipayhk, wechatpay, manual, ...
  gateway_transaction_id TEXT,
  amount INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'HKD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'succeeded', 'failed', 'refunded')),
  payload TEXT, -- JSON response from payment gateway
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- -----------------------------------------------------------------------------
-- 5. Customers & Membership
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS membership_tiers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  name_zh TEXT,
  min_annual_spend INTEGER NOT NULL DEFAULT 0,
  benefits TEXT, -- JSON array/object stored as TEXT
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  whatsapp_consent INTEGER NOT NULL DEFAULT 0,
  membership_tier_id INTEGER REFERENCES membership_tiers(id) ON DELETE SET NULL,
  tags TEXT, -- JSON array stored as TEXT
  notes TEXT,
  assigned_admin_id INTEGER REFERENCES admins(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS customer_activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- inquiry, booking, payment, whatsapp, email_open, login, ...
  metadata TEXT, -- JSON object stored as TEXT
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- -----------------------------------------------------------------------------
-- 6. Admins & RBAC
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK(role IN ('superadmin', 'admin', 'editor', 'support')),
  password_hash TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  last_login INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id INTEGER REFERENCES admins(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- create, update, delete, login, logout, ...
  target_table TEXT NOT NULL,
  target_id TEXT,
  before_json TEXT, -- JSON object before change
  after_json TEXT, -- JSON object after change
  ip_address TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- -----------------------------------------------------------------------------
-- 7. WhatsApp
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  variables TEXT, -- JSON array of variable names stored as TEXT
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'draft')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS broadcast_batches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL REFERENCES whatsapp_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_count INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  rate_min_seconds INTEGER NOT NULL DEFAULT 1,
  rate_max_seconds INTEGER NOT NULL DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'running', 'paused', 'completed', 'cancelled')),
  created_by INTEGER REFERENCES admins(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS broadcast_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER NOT NULL REFERENCES broadcast_batches(id) ON DELETE CASCADE,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'sent', 'delivered', 'failed')),
  error_message TEXT,
  sent_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  last_message_at INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'archived', 'spam')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  direction TEXT NOT NULL CHECK(direction IN ('inbound', 'outbound')),
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  external_message_id TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- -----------------------------------------------------------------------------
-- 8. Coupons
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS coupons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK(discount_type IN ('fixed', 'percentage')),
  discount_value INTEGER NOT NULL DEFAULT 0,
  min_amount INTEGER NOT NULL DEFAULT 0,
  usage_limit INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  valid_from INTEGER,
  valid_to INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'expired')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- =============================================================================
-- Indexes
-- =============================================================================

-- properties
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at);

-- room_types
CREATE INDEX IF NOT EXISTS idx_room_types_property_id ON room_types(property_id);
CREATE INDEX IF NOT EXISTS idx_room_types_status ON room_types(status);
CREATE INDEX IF NOT EXISTS idx_room_types_price ON room_types(price_per_night);

-- property_experiences
CREATE INDEX IF NOT EXISTS idx_property_experiences_property_id ON property_experiences(property_id);
CREATE INDEX IF NOT EXISTS idx_property_experiences_experience_id ON property_experiences(experience_id);

-- packages / package_bookings
CREATE INDEX IF NOT EXISTS idx_packages_status ON packages(status);
CREATE INDEX IF NOT EXISTS idx_packages_slug ON packages(slug);
CREATE INDEX IF NOT EXISTS idx_packages_sort_order ON packages(sort_order);
CREATE INDEX IF NOT EXISTS idx_package_bookings_package_id ON package_bookings(package_id);
CREATE INDEX IF NOT EXISTS idx_package_bookings_status ON package_bookings(status);
CREATE INDEX IF NOT EXISTS idx_package_bookings_payment_status ON package_bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_package_bookings_referral_code ON package_bookings(referral_code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_package_bookings_token ON package_bookings(token) WHERE token IS NOT NULL;

-- cms_articles
CREATE INDEX IF NOT EXISTS idx_cms_articles_status ON cms_articles(status);
CREATE INDEX IF NOT EXISTS idx_cms_articles_category ON cms_articles(category);
CREATE INDEX IF NOT EXISTS idx_cms_articles_published_at ON cms_articles(published_at);

-- leads
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_lead_type ON leads(lead_type);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_admin_id ON leads(assigned_admin_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);

-- bookings
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_property_id ON bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room_type_id ON bookings(room_type_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_check_in ON bookings(check_in);
CREATE INDEX IF NOT EXISTS idx_bookings_check_out ON bookings(check_out);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);

-- payments
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_gateway ON payments(gateway);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_transaction_id ON payments(gateway_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- customers
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_membership_tier_id ON customers(membership_tier_id);
CREATE INDEX IF NOT EXISTS idx_customers_assigned_admin_id ON customers(assigned_admin_id);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);
-- email is already covered by UNIQUE constraint

-- customer_activities
CREATE INDEX IF NOT EXISTS idx_customer_activities_customer_id ON customer_activities(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_activities_activity_type ON customer_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_customer_activities_created_at ON customer_activities(created_at);

-- membership_tiers
-- name is already covered by UNIQUE constraint

-- admins
CREATE INDEX IF NOT EXISTS idx_admins_role ON admins(role);
CREATE INDEX IF NOT EXISTS idx_admins_is_active ON admins(is_active);
-- email is already covered by UNIQUE constraint

-- audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_table ON audit_logs(target_table);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_id ON audit_logs(target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- whatsapp_templates
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_status ON whatsapp_templates(status);
-- name is already covered by UNIQUE constraint

-- broadcast_batches
CREATE INDEX IF NOT EXISTS idx_broadcast_batches_template_id ON broadcast_batches(template_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_batches_status ON broadcast_batches(status);
CREATE INDEX IF NOT EXISTS idx_broadcast_batches_created_by ON broadcast_batches(created_by);
CREATE INDEX IF NOT EXISTS idx_broadcast_batches_created_at ON broadcast_batches(created_at);

-- broadcast_logs
CREATE INDEX IF NOT EXISTS idx_broadcast_logs_batch_id ON broadcast_logs(batch_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_logs_customer_id ON broadcast_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_logs_phone ON broadcast_logs(phone);
CREATE INDEX IF NOT EXISTS idx_broadcast_logs_status ON broadcast_logs(status);
CREATE INDEX IF NOT EXISTS idx_broadcast_logs_sent_at ON broadcast_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_broadcast_logs_created_at ON broadcast_logs(created_at);

-- whatsapp_conversations
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_customer_id ON whatsapp_conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_phone ON whatsapp_conversations(phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_status ON whatsapp_conversations(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_last_message_at ON whatsapp_conversations(last_message_at);

-- whatsapp_messages
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation_id ON whatsapp_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_customer_id ON whatsapp_messages(customer_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_direction ON whatsapp_messages(direction);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON whatsapp_messages(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_external_message_id ON whatsapp_messages(external_message_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created_at ON whatsapp_messages(created_at);

-- coupons
CREATE INDEX IF NOT EXISTS idx_coupons_status ON coupons(status);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_from ON coupons(valid_from);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_to ON coupons(valid_to);
-- code is already covered by UNIQUE constraint
