INSERT INTO project_tags (id, project_id, name)
VALUES ($1, $2, $3)
ON CONFLICT (project_id, lower(name)) WHERE deleted_at IS NULL DO UPDATE SET
    deleted_at = NULL,
    updated_at = now()
RETURNING id
