UPDATE user_limit_overrides SET deleted_at = now(), updated_at = now()
WHERE user_id = $1 AND deleted_at IS NULL
