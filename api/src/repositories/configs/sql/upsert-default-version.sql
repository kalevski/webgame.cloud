INSERT INTO config_versions (id, config_id, build_tag, is_default, values, updated_by)
VALUES ($1, $2, '', true, $3::jsonb, $4)
ON CONFLICT (config_id) WHERE is_default AND deleted_at IS NULL DO UPDATE SET
    values = EXCLUDED.values,
    updated_by = EXCLUDED.updated_by,
    deleted_at = NULL,
    updated_at = now()
RETURNING id
