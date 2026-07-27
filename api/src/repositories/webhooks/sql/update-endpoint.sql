UPDATE webhook_endpoints SET
    url = COALESCE($2, url),
    secret = COALESCE($3, secret),
    description = COALESCE($4, description),
    events = COALESCE($5::jsonb, events),
    active = COALESCE($6, active),
    updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
