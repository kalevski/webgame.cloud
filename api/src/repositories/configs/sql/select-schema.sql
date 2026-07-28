SELECT s.*, (SELECT count(*) FROM configs c WHERE c.schema_id = s.id AND c.deleted_at IS NULL) AS used_by_count
FROM config_schemas s
WHERE s.id = $1 AND s.deleted_at IS NULL
