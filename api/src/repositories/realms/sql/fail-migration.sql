UPDATE project_migrations
SET state = 'failed', error = $2, finished_at = now(), updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
