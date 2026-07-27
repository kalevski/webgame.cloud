SELECT count(*) AS c
FROM audit_log a
LEFT JOIN users u ON u.id = a.actor_id AND u.deleted_at IS NULL
WHERE a.deleted_at IS NULL
  AND ($1::text IS NULL OR a.actor_id = $1)
  AND ($2::text IS NULL OR a.action = $2)
  AND ($3::timestamptz IS NULL OR a.created_at >= $3)
  AND ($4::timestamptz IS NULL OR a.created_at <= $4)
  AND ($5::text IS NULL
       OR a.actor_name ILIKE '%' || $5 || '%'
       OR a.action ILIKE '%' || $5 || '%'
       OR a.target_id ILIKE '%' || $5 || '%'
       OR a.detail ILIKE '%' || $5 || '%'
       OR u.email ILIKE '%' || $5 || '%')
