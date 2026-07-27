UPDATE jobs SET status = 'done', finished_at = now(), error = '', attempts = attempts + 1, updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
