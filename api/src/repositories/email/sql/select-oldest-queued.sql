SELECT
    min(scheduled_at) FILTER (WHERE status = 'queued' AND scheduled_at <= now()) AS oldest,
    count(*) FILTER (WHERE status = 'queued' AND scheduled_at <= now())::int AS queued,
    count(*) FILTER (WHERE status = 'failed')::int AS failed
FROM email_messages
WHERE deleted_at IS NULL
