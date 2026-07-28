UPDATE project_migrations
SET state = $2,
    finished_at = CASE WHEN $2 IN ('completed', 'failed') THEN now() ELSE finished_at END,
    updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
