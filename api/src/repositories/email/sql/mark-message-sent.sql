UPDATE email_messages SET status = 'sent', sent_at = now(), attempts = attempts + 1, error = '',
    updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
