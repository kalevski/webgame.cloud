INSERT INTO idempotency_keys (key, user_id, endpoint, status_code, response)
VALUES ($1, $2, $3, $4, $5::jsonb)
ON CONFLICT (key) DO UPDATE
SET status_code = EXCLUDED.status_code, response = EXCLUDED.response,
    deleted_at = NULL, updated_at = now()
