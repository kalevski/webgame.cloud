INSERT INTO roles (id, name, position) VALUES ($1, $2, $3)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, position = EXCLUDED.position, deleted_at = NULL, updated_at = now()
WHERE roles.deleted_at IS NOT NULL
