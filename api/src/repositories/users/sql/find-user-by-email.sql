SELECT * FROM users WHERE lower(email) = $1 AND deleted_at IS NULL
