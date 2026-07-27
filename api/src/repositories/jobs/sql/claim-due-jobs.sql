UPDATE jobs SET status = 'running', started_at = now(), updated_at = now()
WHERE id IN (
    SELECT id FROM jobs
    WHERE status = 'queued' AND run_at <= now() AND deleted_at IS NULL
    ORDER BY run_at
    LIMIT $1
    FOR UPDATE SKIP LOCKED
)
RETURNING *
