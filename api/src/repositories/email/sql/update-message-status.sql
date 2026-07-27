UPDATE email_messages SET status = $2, error = CASE WHEN $2 = 'queued' THEN '' ELSE error END,
    scheduled_at = CASE WHEN $2 = 'queued' THEN now() ELSE scheduled_at END,
    updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
