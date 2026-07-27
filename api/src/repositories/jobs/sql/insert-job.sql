INSERT INTO jobs (id, kind, payload, run_at, max_attempts, unique_key)
VALUES ($1, $2, $3::jsonb, COALESCE($4, now()), $5, $6)
ON CONFLICT (unique_key) WHERE unique_key IS NOT NULL AND status IN ('queued', 'running') AND deleted_at IS NULL
DO NOTHING
RETURNING id
