SELECT status, count(*) AS c FROM email_messages WHERE deleted_at IS NULL GROUP BY status
