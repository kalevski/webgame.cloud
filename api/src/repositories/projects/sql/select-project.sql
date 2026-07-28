SELECT p.*,
    (SELECT count(*) FROM project_members m WHERE m.project_id = p.id AND m.deleted_at IS NULL) AS member_count,
    (SELECT count(*) FROM assets a WHERE a.project_id = p.id AND a.upload_status = 'ready' AND a.deleted_at IS NULL) AS asset_count
FROM projects p
WHERE p.id = $1 AND p.deleted_at IS NULL
