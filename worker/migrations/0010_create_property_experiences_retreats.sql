-- Ensure property ↔ experience / retreat link tables exist
CREATE TABLE IF NOT EXISTS property_experiences (
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  experience_id INTEGER NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (property_id, experience_id)
);

CREATE TABLE IF NOT EXISTS property_retreats (
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  retreat_id INTEGER NOT NULL REFERENCES retreats(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (property_id, retreat_id)
);
