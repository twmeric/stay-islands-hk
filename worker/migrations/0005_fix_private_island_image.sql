-- Replace upside-down Private-Island-Escape-1.webp with the 180° rotated local asset
UPDATE properties
SET
  image_url = REPLACE(image_url, 'https://www.stayislands.mv/wp-content/uploads/2026/02/Private-Island-Escape-1.webp', '/private-island-escape-180.webp'),
  gallery = REPLACE(gallery, 'https://www.stayislands.mv/wp-content/uploads/2026/02/Private-Island-Escape-1.webp', '/private-island-escape-180.webp')
WHERE id = 2;

UPDATE room_types
SET
  image_url = REPLACE(image_url, 'https://www.stayislands.mv/wp-content/uploads/2026/02/Private-Island-Escape-1.webp', '/private-island-escape-180.webp'),
  gallery = REPLACE(gallery, 'https://www.stayislands.mv/wp-content/uploads/2026/02/Private-Island-Escape-1.webp', '/private-island-escape-180.webp')
WHERE property_id = 2;
