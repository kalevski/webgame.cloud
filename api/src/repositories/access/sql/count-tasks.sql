SELECT count(*) AS c FROM tasks WHERE owner_id = $1 AND deleted_at IS NULL
