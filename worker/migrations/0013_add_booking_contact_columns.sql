-- Store inquiry contact info on bookings until the deal is paid and the contact becomes a real customer.
ALTER TABLE bookings ADD COLUMN customer_name TEXT;
ALTER TABLE bookings ADD COLUMN customer_email TEXT;
ALTER TABLE bookings ADD COLUMN customer_phone TEXT;
