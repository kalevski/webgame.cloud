SELECT * FROM api_keys
WHERE owner_id = $1 AND deleted_at IS NULL
ORDER BY created_at DESC
