UPDATE designs
SET name = $2, entries = $3::jsonb, file_id = $4, updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
