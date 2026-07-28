UPDATE builds SET status = 'running', updated_at = now()
WHERE id = $1 AND realm_id = $2 AND status IN ('pending', 'running') AND deleted_at IS NULL
