INSERT INTO user_permissions (user_id, permission, granted) VALUES ($1, $2, $3)
ON CONFLICT (user_id, permission) DO UPDATE
SET granted = EXCLUDED.granted, deleted_at = NULL, updated_at = now()
