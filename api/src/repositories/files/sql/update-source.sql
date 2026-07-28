UPDATE asset_sources SET
    name = COALESCE($2, name),
    config = COALESCE($3::jsonb, config),
    secret = COALESCE($4, secret),
    updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
