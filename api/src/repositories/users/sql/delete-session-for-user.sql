UPDATE sessions SET deleted_at = now(), updated_at = now()
WHERE user_id = $1 AND public_id = $2 AND deleted_at IS NULL
