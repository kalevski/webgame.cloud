SELECT count(*) AS c FROM projects WHERE realm_id = $1 AND deleted_at IS NULL
