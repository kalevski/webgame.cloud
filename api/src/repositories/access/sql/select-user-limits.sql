SELECT resource, max_count FROM user_limit_overrides WHERE user_id = $1 AND deleted_at IS NULL
