UPDATE assets
SET name = COALESCE($3, name),
    category_id = CASE WHEN $5::boolean THEN $4 ELSE category_id END,
    tags = COALESCE($6::text[], tags),
    updated_at = now()
WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL
