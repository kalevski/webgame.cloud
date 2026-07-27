SELECT count(*) AS c FROM users WHERE role = $1 AND deleted_at IS NULL
