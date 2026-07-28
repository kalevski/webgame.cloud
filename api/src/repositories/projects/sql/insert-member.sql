INSERT INTO project_members (id, project_id, user_id, permissions)
VALUES ($1, $2, $3, $4)
ON CONFLICT (project_id, user_id) WHERE deleted_at IS NULL DO UPDATE SET
    permissions = EXCLUDED.permissions,
    deleted_at = NULL,
    updated_at = now()
RETURNING id
