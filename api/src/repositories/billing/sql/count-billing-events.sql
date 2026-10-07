SELECT count(*) AS c
FROM billing_event e
LEFT JOIN users u ON u.id = e.user_id AND u.deleted_at IS NULL
WHERE e.deleted_at IS NULL
  AND ($1::text IS NULL OR e.status = $1)
  AND ($2::text IS NULL OR e.event_type = $2)
  AND ($3::text IS NULL OR e.user_id = $3)
  AND ($4::text IS NULL OR e.event_type ILIKE '%' || $4 || '%' OR e.error ILIKE '%' || $4 || '%'
       OR u.email ILIKE '%' || $4 || '%' OR u.name ILIKE '%' || $4 || '%')
