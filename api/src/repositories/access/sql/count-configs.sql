SELECT count(*) AS c FROM configs WHERE project_id = $1 AND deleted_at IS NULL
