-- Add referral tracking to leads so referrers can be notified when a referred visitor leaves contact info.
ALTER TABLE leads ADD COLUMN referral_code TEXT;
