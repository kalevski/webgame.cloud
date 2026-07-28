SELECT r.*,
    (SELECT count(*) FROM projects p WHERE p.realm_id = r.id AND p.deleted_at IS NULL) AS project_count
FROM realms r
WHERE r.id = $1 AND r.deleted_at IS NULL
