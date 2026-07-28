SELECT * FROM project_migrations
WHERE project_id = $1 AND state NOT IN ('completed', 'failed') AND deleted_at IS NULL
