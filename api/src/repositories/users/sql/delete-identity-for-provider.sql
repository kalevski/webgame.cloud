UPDATE user_identities SET deleted_at = now(), updated_at = now()
WHERE user_id = $1 AND provider = $2 AND deleted_at IS NULL
