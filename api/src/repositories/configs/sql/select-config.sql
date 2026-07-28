SELECT c.*, s.name AS schema_name, s.update_iterator AS schema_iterator
FROM configs c
JOIN config_schemas s ON s.id = c.schema_id AND s.deleted_at IS NULL
WHERE c.id = $1 AND c.deleted_at IS NULL
