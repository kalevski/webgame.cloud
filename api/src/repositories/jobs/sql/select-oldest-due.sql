SELECT min(run_at) AS oldest, count(*)::int AS due
FROM jobs
WHERE status = 'queued' AND run_at <= now() AND deleted_at IS NULL
