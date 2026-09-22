UPDATE idempotency_keys SET deleted_at = now(), updated_at = now()
WHERE key = $1 AND status_code = 0 AND deleted_at IS NULL
