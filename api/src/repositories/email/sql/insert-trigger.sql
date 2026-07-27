INSERT INTO email_triggers (id, action, template_key, recipient, role_id, user_ids, custom_email, active)
VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
ON CONFLICT (action, template_key) WHERE deleted_at IS NULL DO UPDATE SET
    recipient = EXCLUDED.recipient,
    role_id = EXCLUDED.role_id,
    user_ids = EXCLUDED.user_ids,
    custom_email = EXCLUDED.custom_email,
    active = EXCLUDED.active,
    updated_at = now()
