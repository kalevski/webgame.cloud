UPDATE email_messages SET status = 'sending', updated_at = now()
WHERE id IN (
    SELECT id FROM email_messages
    WHERE status = 'queued' AND scheduled_at <= now() AND deleted_at IS NULL
    ORDER BY scheduled_at
    LIMIT $1
    FOR UPDATE SKIP LOCKED
)
RETURNING *
