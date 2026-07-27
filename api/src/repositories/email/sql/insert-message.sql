INSERT INTO email_messages (id, to_email, to_name, subject, body, template_key, scheduled_at)
VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, now()))
