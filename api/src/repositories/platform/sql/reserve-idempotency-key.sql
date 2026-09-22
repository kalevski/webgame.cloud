INSERT INTO idempotency_keys (key, user_id, endpoint, fingerprint, status_code, response)
VALUES ($1, $2, $3, $4, 0, NULL)
ON CONFLICT (key) DO UPDATE
SET user_id = EXCLUDED.user_id, endpoint = EXCLUDED.endpoint, fingerprint = EXCLUDED.fingerprint,
    status_code = 0, response = NULL, deleted_at = NULL, created_at = now(), updated_at = now()
WHERE idempotency_keys.deleted_at IS NOT NULL
   OR (idempotency_keys.status_code = 0 AND idempotency_keys.created_at < now() - make_interval(secs => $5))
RETURNING key
