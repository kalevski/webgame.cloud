SELECT c.key, v.id AS version_id, v.build_tag, v.values, v.updated_at
FROM configs c
JOIN LATERAL (
    SELECT * FROM config_versions vv
    WHERE vv.config_id = c.id AND vv.deleted_at IS NULL
      AND (vv.build_tag = $2 OR vv.is_default)
    ORDER BY (vv.build_tag = $2) DESC
    LIMIT 1
) v ON true
WHERE c.project_id = $1 AND c.deleted_at IS NULL
