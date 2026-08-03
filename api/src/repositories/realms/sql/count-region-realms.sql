SELECT count(*) AS c FROM realms WHERE region_id = $1 AND deleted_at IS NULL
