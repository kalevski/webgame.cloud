SELECT (
    (SELECT count(*) FROM bundles WHERE project_id = $1 AND deleted_at IS NULL AND build_tag = $2)
    + (SELECT count(*) FROM builds WHERE project_id = $1 AND deleted_at IS NULL AND build_tag = $2)
    + (SELECT count(*) FROM config_versions v
        JOIN configs c ON c.id = v.config_id AND c.deleted_at IS NULL
        WHERE c.project_id = $1 AND v.deleted_at IS NULL AND v.build_tag = $2)
) AS c
