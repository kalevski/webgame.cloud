SELECT p.*,
    (SELECT count(*) FROM project_members m WHERE m.project_id = p.id AND m.deleted_at IS NULL) AS member_count,
    (SELECT count(*) FROM assets a WHERE a.project_id = p.id AND a.upload_status = 'ready' AND a.deleted_at IS NULL) AS asset_count,
    mine.permissions AS caller_permissions
FROM projects p
JOIN project_members mine ON mine.project_id = p.id AND mine.user_id = $1 AND mine.deleted_at IS NULL
WHERE p.deleted_at IS NULL
  AND (($2::boolean IS TRUE AND p.archived_at IS NOT NULL) OR ($2::boolean IS NOT TRUE AND p.archived_at IS NULL))
ORDER BY p.updated_at DESC
