SELECT count(*) AS c FROM bundles WHERE project_id = $1 AND deleted_at IS NULL
