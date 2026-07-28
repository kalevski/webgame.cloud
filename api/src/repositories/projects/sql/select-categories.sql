SELECT id, project_id, name FROM asset_categories
WHERE project_id = $1 AND deleted_at IS NULL
ORDER BY name
