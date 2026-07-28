UPDATE config_schemas SET deleted_at = now(), updated_at = now()
WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM configs WHERE schema_id = $1 AND deleted_at IS NULL)
