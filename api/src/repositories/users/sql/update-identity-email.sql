UPDATE user_identities SET email = $3, updated_at = now()
WHERE provider = $1 AND subject = $2 AND deleted_at IS NULL RETURNING *
