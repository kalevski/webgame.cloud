SELECT count(*) AS c FROM projects WHERE owner_id = $1 AND deleted_at IS NULL
