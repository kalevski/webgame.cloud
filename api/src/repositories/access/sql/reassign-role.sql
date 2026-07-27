UPDATE users SET role = $2, updated_at = now() WHERE role = $1 AND deleted_at IS NULL
