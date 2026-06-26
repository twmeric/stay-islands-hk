UPDATE admins SET email = 'admin', password_hash = '$2b$10$vSsDNAvlK6ZF5Dy0tSYn2.XhAF8MODSSf42q4kXHdveg2Xg7f1V4m', updated_at = unixepoch() WHERE id = 1;
SELECT id, email, length(password_hash) as hash_len FROM admins WHERE id = 1;
