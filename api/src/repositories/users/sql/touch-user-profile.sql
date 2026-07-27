UPDATE users
SET name = $2, picture = $3, updated_at = now()
WHERE id = $1 AND deleted_at IS NULL RETURNING *
