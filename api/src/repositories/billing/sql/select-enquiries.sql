SELECT e.*, u.email AS user_email, u.name AS user_name, p.name AS plan_name
FROM sales_enquiries e
JOIN users u ON u.id = e.user_id AND u.deleted_at IS NULL
LEFT JOIN billing_plans p ON p.id = e.plan_id AND p.deleted_at IS NULL
WHERE e.deleted_at IS NULL
  AND ($1::text IS NULL OR e.status = $1)
  AND ($2::text IS NULL OR e.plan_id = $2)
  AND ($3::text IS NULL OR u.email ILIKE '%' || $3 || '%' OR u.name ILIKE '%' || $3 || '%' OR e.answers::text ILIKE '%' || $3 || '%')
ORDER BY e.created_at DESC
LIMIT $4 OFFSET $5
