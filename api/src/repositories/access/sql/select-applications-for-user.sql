SELECT a.*,
       r.name AS role_name,
       u.name AS user_name,
       u.email AS user_email,
       d.name AS decided_by_name
FROM role_applications a
JOIN roles r ON r.id = a.role_id AND r.deleted_at IS NULL
JOIN users u ON u.id = a.user_id AND u.deleted_at IS NULL
LEFT JOIN users d ON d.id = a.decided_by AND d.deleted_at IS NULL
WHERE a.user_id = $1 AND a.deleted_at IS NULL
ORDER BY a.created_at DESC
LIMIT 50
