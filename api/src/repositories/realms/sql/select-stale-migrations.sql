SELECT * FROM project_migrations
WHERE state NOT IN ('completed', 'failed', 'purging')
  AND deleted_at IS NULL
  AND started_at < now() - make_interval(mins => $1)
