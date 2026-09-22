SELECT key, value FROM settings WHERE key = ANY($1) AND deleted_at IS NULL
