INSERT INTO asset_sources (id, name, type, config, secret, allowed_extensions, allowed_mime_types)
VALUES ($1, $2, $3, $4::jsonb, $5, $6::jsonb, $7::jsonb)
RETURNING id
