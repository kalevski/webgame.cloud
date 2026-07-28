SELECT b.*, bu.name AS bundle_name, u.name AS triggered_by_name
FROM builds b
JOIN bundles bu ON bu.id = b.bundle_id AND bu.deleted_at IS NULL
LEFT JOIN users u ON u.id = b.triggered_by AND u.deleted_at IS NULL
WHERE b.id = $1 AND b.deleted_at IS NULL
