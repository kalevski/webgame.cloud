UPDATE email_messages SET status = 'queued', updated_at = now()
WHERE status = 'sending' AND scheduled_at < now() - interval '10 minutes' AND deleted_at IS NULL
