SELECT m.*, u.name, u.email, u.picture
FROM project_members m
JOIN users u ON u.id = m.user_id AND u.deleted_at IS NULL
WHERE m.project_id = $1 AND m.deleted_at IS NULL
ORDER BY m.created_at
