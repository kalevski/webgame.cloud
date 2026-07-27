UPDATE tasks SET title = $2, status = $3, updated_at = now() WHERE id = $1 AND deleted_at IS NULL
