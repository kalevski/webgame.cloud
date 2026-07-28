UPDATE builds SET build_tag = $2, updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
