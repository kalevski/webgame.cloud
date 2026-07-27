SELECT * FROM idempotency_keys WHERE key = $1 AND deleted_at IS NULL
