UPDATE users SET consented_at = COALESCE(consented_at, now()), updated_at = now()
WHERE id = $1 AND deleted_at IS NULL RETURNING *
