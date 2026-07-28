UPDATE project_build_tags SET deleted_at = now(), updated_at = now()
WHERE project_id = $1 AND deleted_at IS NULL AND NOT (lower(name) = ANY($2::text[]))
RETURNING id, name
