INSERT INTO rate_limits (bucket, hits, window_start) VALUES ($1, 1, now())
ON CONFLICT (bucket) DO UPDATE SET
    hits = CASE WHEN rate_limits.window_start < now() - make_interval(secs => $2) THEN 1 ELSE rate_limits.hits + 1 END,
    window_start = CASE WHEN rate_limits.window_start < now() - make_interval(secs => $2) THEN now() ELSE rate_limits.window_start END,
    deleted_at = NULL,
    updated_at = now()
RETURNING hits, window_start
