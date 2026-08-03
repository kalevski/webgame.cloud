UPDATE video_templates
SET name = $2, description = $3, format = $4, updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
