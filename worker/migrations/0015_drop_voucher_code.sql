-- Remove the obsolete voucher_code column from bookings.
-- The voucher/e-voucher feature was removed from the admin UI and order page.
ALTER TABLE bookings DROP COLUMN voucher_code;
