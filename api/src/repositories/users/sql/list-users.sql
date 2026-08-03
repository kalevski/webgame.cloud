SELECT * FROM users WHERE kind = 'human' AND deleted_at IS NULL ORDER BY created_at, email
