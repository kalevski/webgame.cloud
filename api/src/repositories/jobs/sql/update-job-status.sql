UPDATE jobs SET status = $2,
    run_at = CASE WHEN $2 = 'queued' THEN now() ELSE run_at END,
    error = CASE WHEN $2 = 'queued' THEN '' ELSE error END,
    updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
