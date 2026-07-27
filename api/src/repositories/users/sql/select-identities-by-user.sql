SELECT * FROM user_identities WHERE user_id = $1 AND deleted_at IS NULL ORDER BY created_at
