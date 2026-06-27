-- Add lifecycle and payment columns to bookings
ALTER TABLE bookings ADD COLUMN payment_method TEXT;
ALTER TABLE bookings ADD COLUMN payment_reference TEXT;
ALTER TABLE bookings ADD COLUMN payment_deadline INTEGER;
ALTER TABLE bookings ADD COLUMN paid_at INTEGER;
ALTER TABLE bookings ADD COLUMN supplier_status TEXT DEFAULT 'pending' CHECK(supplier_status IN ('pending', 'confirmed', 'rejected'));
ALTER TABLE bookings ADD COLUMN admin_notes TEXT;
ALTER TABLE bookings ADD COLUMN cancellation_reason TEXT;
ALTER TABLE bookings ADD COLUMN refund_amount INTEGER DEFAULT 0;
ALTER TABLE bookings ADD COLUMN cancelled_at INTEGER;
ALTER TABLE bookings ADD COLUMN confirmed_at INTEGER;

-- Add cancellation policy to properties and room_types
ALTER TABLE properties ADD COLUMN cancellation_policy TEXT DEFAULT '{"rules": [{"days_before": 30, "refund_percent": 100}, {"days_before": 14, "refund_percent": 50}, {"days_before": 7, "refund_percent": 0}]}';
ALTER TABLE room_types ADD COLUMN cancellation_policy TEXT;
