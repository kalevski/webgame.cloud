UPDATE api_keys SET revoked_at = now(), deleted_at = now(), updated_at = now()
WHERE id = $1 AND owner_id = $2 AND deleted_at IS NULL
