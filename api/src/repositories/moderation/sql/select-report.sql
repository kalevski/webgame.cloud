SELECT r.*, coalesce(nullif(u.name, ''), u.email, '') AS reporter_name
FROM reports r
LEFT JOIN users u ON u.id = r.reporter_id AND u.deleted_at IS NULL
WHERE r.id = $1 AND r.deleted_at IS NULL
