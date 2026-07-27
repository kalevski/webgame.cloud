UPDATE email_templates SET
    name = COALESCE($2, name),
    description = COALESCE($3, description),
    subject = COALESCE($4, subject),
    body = COALESCE($5, body),
    active = COALESCE($6, active),
    updated_at = now()
WHERE key = $1 AND deleted_at IS NULL
