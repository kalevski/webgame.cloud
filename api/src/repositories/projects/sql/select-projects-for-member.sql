SELECT p.*,
    (SELECT count(*) FROM project_members m WHERE m.project_id = p.id AND m.deleted_at IS NULL) AS member_count
FROM projects p
JOIN project_members mine ON mine.project_id = p.id AND mine.user_id = $1 AND mine.deleted_at IS NULL
WHERE p.deleted_at IS NULL
ORDER BY p.created_at DESC
