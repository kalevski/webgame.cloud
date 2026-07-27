SELECT permission, granted FROM user_permissions WHERE user_id = $1 AND deleted_at IS NULL
