UPDATE projects SET owner_id = $2, updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
