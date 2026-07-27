INSERT INTO tasks (id, project_id, owner_id, title, status, position)
VALUES (
    $1, $2, $3, $4, $5,
    coalesce((SELECT max(position) + 1 FROM tasks WHERE project_id = $2 AND deleted_at IS NULL), 0)
)
RETURNING id
