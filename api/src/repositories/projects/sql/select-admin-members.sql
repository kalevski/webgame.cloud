SELECT m.id,
    m.user_id,
    m.permissions,
    m.created_at,
    u.name,
    u.email,
    u.picture,
    u.role,
    u.active,
    u.verified,
    (p.owner_id = m.user_id) AS is_owner
FROM project_members m
JOIN projects p ON p.id = m.project_id AND p.deleted_at IS NULL
JOIN users u ON u.id = m.user_id AND u.deleted_at IS NULL
WHERE m.project_id = $1 AND m.deleted_at IS NULL
ORDER BY (p.owner_id = m.user_id) DESC, lower(u.email)
