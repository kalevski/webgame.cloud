UPDATE jobs SET status = 'queued', updated_at = now()
WHERE status = 'running' AND started_at < now() - interval '10 minutes' AND deleted_at IS NULL
