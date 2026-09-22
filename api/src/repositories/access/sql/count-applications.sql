SELECT count(*) AS c
FROM role_applications a
JOIN users u ON u.id = a.user_id AND u.deleted_at IS NULL
WHERE a.deleted_at IS NULL
  AND ($1::text IS NULL OR a.status = $1)
  AND ($2::text IS NULL OR a.role_id = $2)
  AND (
      $3::text IS NULL
      OR u.email ILIKE '%' || $3 || '%'
      OR u.name ILIKE '%' || $3 || '%'
      OR a.message ILIKE '%' || $3 || '%'
  )
