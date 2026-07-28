SELECT id, project_id, name FROM project_build_tags
WHERE project_id = $1 AND deleted_at IS NULL
ORDER BY name
