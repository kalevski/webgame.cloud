SELECT a.*,
       r.name AS role_name,
       u.name AS user_name,
       u.email AS user_email,
       d.name AS decided_by_name
FROM role_applications a
JOIN roles r ON r.id = a.role_id AND r.deleted_at IS NULL
JOIN users u ON u.id = a.user_id AND u.deleted_at IS NULL
LEFT JOIN users d ON d.id = a.decided_by AND d.deleted_at IS NULL
WHERE a.deleted_at IS NULL
  AND ($1::text IS NULL OR a.status = $1)
  AND ($2::text IS NULL OR a.role_id = $2)
  AND (
      $3::text IS NULL
      OR u.email ILIKE '%' || $3 || '%'
      OR u.name ILIKE '%' || $3 || '%'
      OR a.message ILIKE '%' || $3 || '%'
  )
ORDER BY a.created_at DESC
LIMIT $4 OFFSET $5
