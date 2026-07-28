UPDATE projects
SET name = $2,
    description = $3,
    app_type = $4,
    icon = $5,
    color = $6,
    default_category_id = $7,
    updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
