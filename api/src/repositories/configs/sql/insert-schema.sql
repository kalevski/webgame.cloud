INSERT INTO config_schemas (id, project_id, name, definition)
VALUES ($1, $2, $3, $4::jsonb)
RETURNING id
