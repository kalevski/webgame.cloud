SELECT key, value FROM settings
WHERE key LIKE $1 || '%' AND deleted_at IS NULL
