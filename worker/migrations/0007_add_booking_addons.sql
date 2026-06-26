-- Add addons column to bookings for storing selected experience/activity add-ons
ALTER TABLE bookings ADD COLUMN addons TEXT DEFAULT '[]';
