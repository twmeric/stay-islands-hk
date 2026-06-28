-- Remove deprecated activities JSON column; activities are now managed via property_experiences / property_retreats
ALTER TABLE properties DROP COLUMN activities;
