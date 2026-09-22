SELECT * FROM sessions WHERE user_id = $1 AND id = $2 AND deleted_at IS NULL
