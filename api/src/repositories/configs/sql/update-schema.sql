UPDATE config_schemas
SET name = $3,
    definition = $4::jsonb,
    update_iterator = update_iterator + CASE WHEN definition::text <> $4::jsonb::text THEN 1 ELSE 0 END,
    updated_at = now()
WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL
