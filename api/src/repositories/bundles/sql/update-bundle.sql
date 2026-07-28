UPDATE bundles
SET name = $3,
    engine = $4,
    category_id = $5,
    included_tags = $6,
    excluded_tags = $7,
    build_tag = $8,
    algorithm = $9,
    downscale = $10,
    rotation_enabled = $11,
    updated_at = now()
WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL
