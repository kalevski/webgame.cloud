SELECT (
    (SELECT count(*) FROM assets WHERE project_id = $1 AND deleted_at IS NULL AND category_id = $2)
    + (SELECT count(*) FROM bundles WHERE project_id = $1 AND deleted_at IS NULL AND category_id = $2)
) AS c
