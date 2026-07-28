UPDATE projects
SET archived_at = CASE WHEN $2::boolean THEN now() ELSE NULL END,
    updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
