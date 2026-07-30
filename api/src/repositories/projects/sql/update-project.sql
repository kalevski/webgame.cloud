UPDATE projects
SET name = $2,
    description = $3,
    app_type = $4,
    genre = $5,
    icon = $6,
    color = $7,
    default_category_id = $8,
    updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
