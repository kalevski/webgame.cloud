UPDATE roles SET deleted_at = now(), updated_at = now()
WHERE id = $1 AND NOT builtin AND deleted_at IS NULL
