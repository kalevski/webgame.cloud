UPDATE frame_templates
SET name = $2, description = $3, format = $4, background = $5,
    layers = $6::jsonb, fields = $7::jsonb,
    updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
