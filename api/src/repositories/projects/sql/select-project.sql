SELECT p.*, (SELECT count(*) FROM tasks t WHERE t.project_id = p.id AND t.deleted_at IS NULL) AS task_count
FROM projects p
WHERE p.id = $1 AND p.deleted_at IS NULL
