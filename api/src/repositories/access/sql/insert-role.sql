INSERT INTO roles (id, name, position, applicable, application_prompt) VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    position = EXCLUDED.position,
    applicable = EXCLUDED.applicable,
    application_prompt = EXCLUDED.application_prompt,
    deleted_at = NULL,
    updated_at = now()
WHERE roles.deleted_at IS NOT NULL
