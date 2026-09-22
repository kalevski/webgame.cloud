UPDATE asset_sources SET
    name = COALESCE($2, name),
    config = COALESCE($3::jsonb, config),
    secret = COALESCE($4, secret),
    allowed_extensions = COALESCE($5::jsonb, allowed_extensions),
    allowed_mime_types = COALESCE($6::jsonb, allowed_mime_types),
    updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
