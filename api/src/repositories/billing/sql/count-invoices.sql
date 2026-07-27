SELECT count(*) AS c
FROM invoices i
JOIN users u ON u.id = i.user_id AND u.deleted_at IS NULL
WHERE i.deleted_at IS NULL
  AND ($1::text IS NULL OR i.user_id = $1)
  AND ($2::text IS NULL OR i.plan_id = $2)
  AND ($3::text IS NULL OR i.status = $3)
  AND ($4::text IS NULL OR i.provider = $4)
  AND ($5::timestamptz IS NULL OR i.issued_at >= $5)
  AND ($6::timestamptz IS NULL OR i.issued_at <= $6)
  AND ($7::text IS NULL OR i.number ILIKE '%' || $7 || '%' OR u.email ILIKE '%' || $7 || '%' OR u.name ILIKE '%' || $7 || '%')
