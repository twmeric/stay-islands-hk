-- Replace Rectangle-79-4.webp with the uploaded Madivaru boat intro image for Stay Madivaru (id=3)
UPDATE properties
SET
  image_url = REPLACE(image_url, 'https://www.stayislands.mv/wp-content/uploads/2026/02/Rectangle-79-4.webp', '/madivaru-intro.jpg'),
  gallery = REPLACE(gallery, 'https://www.stayislands.mv/wp-content/uploads/2026/02/Rectangle-79-4.webp', '/madivaru-intro.jpg')
WHERE id = 3;

UPDATE room_types
SET
  image_url = REPLACE(image_url, 'https://www.stayislands.mv/wp-content/uploads/2026/02/Rectangle-79-4.webp', '/madivaru-intro.jpg'),
  gallery = REPLACE(gallery, 'https://www.stayislands.mv/wp-content/uploads/2026/02/Rectangle-79-4.webp', '/madivaru-intro.jpg')
WHERE property_id = 3;
