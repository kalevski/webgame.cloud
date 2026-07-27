UPDATE email_messages SET
    attempts = attempts + 1,
    error = $2,
    status = CASE WHEN attempts + 1 >= $3 THEN 'failed' ELSE 'queued' END,
    scheduled_at = CASE WHEN attempts + 1 >= $3 THEN scheduled_at ELSE now() + make_interval(secs => $4) END,
    updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
