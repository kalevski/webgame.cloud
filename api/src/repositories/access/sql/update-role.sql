UPDATE roles SET
    name = $2,
    applicable = $3,
    application_prompt = $4,
    updated_at = now()
WHERE id = $1 AND NOT builtin AND deleted_at IS NULL
