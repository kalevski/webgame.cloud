SELECT * FROM user_identities WHERE provider = $1 AND subject = $2 AND deleted_at IS NULL
