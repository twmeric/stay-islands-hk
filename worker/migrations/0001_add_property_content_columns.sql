-- Migration: Add rich content columns to properties table
-- Created: 2026-06-20

ALTER TABLE properties ADD COLUMN gallery TEXT; -- JSON array of image URLs
ALTER TABLE properties ADD COLUMN facilities TEXT; -- JSON array of {icon, label}
ALTER TABLE properties ADD COLUMN activities TEXT; -- JSON array of {image, name, description}
ALTER TABLE properties ADD COLUMN location_details TEXT; -- JSON object {description, mapImage, nearby}
ALTER TABLE properties ADD COLUMN story TEXT; -- JSON object {title, content}
