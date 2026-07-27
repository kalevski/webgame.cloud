INSERT INTO role_permissions (role_id, permission) VALUES ($1, $2)
ON CONFLICT (role_id, permission) DO UPDATE SET deleted_at = NULL, updated_at = now()
