INSERT INTO role_limits (role, resource, max_count) VALUES ($1, $2, $3)
ON CONFLICT (role, resource) DO UPDATE
SET max_count = EXCLUDED.max_count, deleted_at = NULL, updated_at = now()
