-- Clean up test data after referral flow verification
DELETE FROM referral_orders;
DELETE FROM package_bookings;
DELETE FROM bookings;
DELETE FROM whatsapp_messages;
DELETE FROM whatsapp_conversations;
DELETE FROM customer_activities;
DELETE FROM customers;
DELETE FROM leads;
DELETE FROM referrers;
DELETE FROM payments;
DELETE FROM audit_logs;
