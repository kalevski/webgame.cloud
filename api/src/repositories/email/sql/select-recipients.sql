SELECT id, email, name, role FROM users WHERE active AND deleted_at IS NULL ORDER BY name, email
