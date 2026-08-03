SELECT * FROM frame_templates
WHERE owner_id = $1 AND deleted_at IS NULL
ORDER BY updated_at DESC, id
