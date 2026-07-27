UPDATE roles SET name = $2, updated_at = now() WHERE id = $1 AND NOT builtin AND deleted_at IS NULL
