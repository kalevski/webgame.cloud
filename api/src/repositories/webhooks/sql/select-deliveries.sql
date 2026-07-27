SELECT d.*, e.url AS endpoint_url
FROM webhook_deliveries d
LEFT JOIN webhook_endpoints e ON e.id = d.endpoint_id AND e.deleted_at IS NULL
WHERE d.deleted_at IS NULL
  AND ($1::text IS NULL OR d.endpoint_id = $1)
  AND ($2::text IS NULL OR d.status = $2)
  AND ($3::text IS NULL OR d.action = $3)
  AND ($4::text IS NULL OR d.action ILIKE '%' || $4 || '%' OR d.error ILIKE '%' || $4 || '%' OR e.url ILIKE '%' || $4 || '%')
  AND ($7::timestamptz IS NULL OR (d.created_at, d.id) < ($7, $8::text))
ORDER BY d.created_at DESC, d.id DESC
LIMIT $5 OFFSET $6
