SELECT p.*, (SELECT count(*) FROM tasks t WHERE t.project_id = p.id AND t.deleted_at IS NULL) AS task_count
FROM projects p
WHERE (p.owner_id = $1 OR p.visibility = 'shared') AND p.deleted_at IS NULL
ORDER BY p.updated_at DESC, p.id
