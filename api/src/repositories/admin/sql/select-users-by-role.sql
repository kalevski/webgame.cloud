SELECT u.role, coalesce(r.name, u.role) AS name, count(*) AS count
FROM users u
LEFT JOIN roles r ON r.id = u.role AND r.deleted_at IS NULL
WHERE u.kind = 'human' AND u.deleted_at IS NULL
GROUP BY u.role, r.name ORDER BY count(*) DESC
