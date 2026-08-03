SELECT id, project_id, doc, created_at, updated_at, deleted_at
FROM project_translations
WHERE project_id = $1
  AND deleted_at IS NULL
LIMIT 1
