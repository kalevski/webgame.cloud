UPDATE jobs SET
    attempts = attempts + 1,
    error = $2,
    status = CASE WHEN attempts + 1 >= max_attempts THEN 'failed' ELSE 'queued' END,
    run_at = CASE WHEN attempts + 1 >= max_attempts THEN run_at ELSE now() + make_interval(secs => $3) END,
    finished_at = CASE WHEN attempts + 1 >= max_attempts THEN now() ELSE NULL END,
    updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
