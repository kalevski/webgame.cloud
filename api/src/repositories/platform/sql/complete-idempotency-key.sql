UPDATE idempotency_keys
SET status_code = $2, response = $3::jsonb, updated_at = now()
WHERE key = $1 AND deleted_at IS NULL
