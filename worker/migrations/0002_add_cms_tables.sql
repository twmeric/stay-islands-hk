-- Migration: Add CMS tables for Experiences, Retreats, and expand Room Types
-- Created: 2026-06-20

-- Expand room_types with richer room details
ALTER TABLE room_types ADD COLUMN bed_type TEXT;
ALTER TABLE room_types ADD COLUMN view TEXT;
ALTER TABLE room_types ADD COLUMN size_sqm INTEGER;
ALTER TABLE room_types ADD COLUMN occupancy TEXT;
ALTER TABLE room_types ADD COLUMN gallery TEXT; -- JSON array of image URLs
ALTER TABLE room_types ADD COLUMN features TEXT; -- JSON array of strings

-- Experiences table
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
  price_note TEXT,
  image_url TEXT,
  icon_name TEXT,
  sort_order INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Retreats table
CREATE TABLE IF NOT EXISTS retreats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  name_zh TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  description_zh TEXT,
  duration TEXT,
  location TEXT,
  audience TEXT,
  itinerary TEXT, -- JSON array of {day, title, desc}
  price_note TEXT,
  image_url TEXT,
  icon_name TEXT,
  sort_order INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
