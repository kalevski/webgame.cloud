SELECT b.*, bu.name AS bundle_name, u.name AS triggered_by_name
FROM builds b
JOIN bundles bu ON bu.id = b.bundle_id AND bu.deleted_at IS NULL
LEFT JOIN users u ON u.id = b.triggered_by AND u.deleted_at IS NULL
WHERE b.project_id = $1 AND b.deleted_at IS NULL
  AND ($2::text IS NULL OR b.status = $2)
  AND ($3::text IS NULL OR b.bundle_id = $3)
  AND ($4::timestamptz IS NULL OR (b.created_at, b.id) < ($4, $5))
ORDER BY b.created_at DESC, b.id DESC
LIMIT $6 OFFSET $7
