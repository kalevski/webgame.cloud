SELECT m.*, u.name, u.email, u.picture
FROM project_members m
JOIN users u ON u.id = m.user_id AND u.deleted_at IS NULL
WHERE m.id = $1 AND m.project_id = $2 AND m.deleted_at IS NULL
