SELECT * FROM tasks WHERE project_id = $1 AND deleted_at IS NULL ORDER BY position, created_at, id
