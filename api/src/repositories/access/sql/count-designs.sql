SELECT count(*) AS c FROM designs WHERE owner_id = $1 AND deleted_at IS NULL
