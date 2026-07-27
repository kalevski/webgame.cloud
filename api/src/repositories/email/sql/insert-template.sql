INSERT INTO email_templates (key, name, description, subject, body, active)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (key) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    subject = EXCLUDED.subject,
    body = EXCLUDED.body,
    active = EXCLUDED.active,
    deleted_at = NULL,
    updated_at = now()
