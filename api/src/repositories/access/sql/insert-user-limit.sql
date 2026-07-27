INSERT INTO user_limit_overrides (user_id, resource, max_count) VALUES ($1, $2, $3)
ON CONFLICT (user_id, resource) DO UPDATE
SET max_count = EXCLUDED.max_count, deleted_at = NULL, updated_at = now()
