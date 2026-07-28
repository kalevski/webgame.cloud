UPDATE builds
SET status = 'failed', error = 'realm timeout', finished_at = now(), updated_at = now()
WHERE status = 'running' AND deleted_at IS NULL
  AND claimed_at < now() - make_interval(mins => $1)
RETURNING id, project_id
