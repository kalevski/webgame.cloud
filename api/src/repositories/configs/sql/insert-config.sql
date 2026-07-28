INSERT INTO configs (id, project_id, schema_id, key, description, schema_update_iterator)
VALUES ($1, $2, $3, $4, $5, (SELECT update_iterator FROM config_schemas WHERE id = $3))
RETURNING id
