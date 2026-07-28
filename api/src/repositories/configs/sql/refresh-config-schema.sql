UPDATE configs
SET schema_update_iterator = (SELECT update_iterator FROM config_schemas WHERE id = configs.schema_id),
    updated_at = now()
WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL
