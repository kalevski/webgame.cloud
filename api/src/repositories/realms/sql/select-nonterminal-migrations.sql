SELECT * FROM project_migrations
WHERE state NOT IN ('completed', 'failed') AND deleted_at IS NULL
ORDER BY started_at
