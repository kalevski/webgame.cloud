INSERT INTO bundles (
    id, project_id, name, engine, category_id, included_tags, excluded_tags,
    build_tag, algorithm, downscale, rotation_enabled
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
RETURNING id
