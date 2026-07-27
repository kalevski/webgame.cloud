SELECT * FROM jobs
WHERE deleted_at IS NULL
  AND ($1::text IS NULL OR status = $1)
  AND ($2::text IS NULL OR kind = $2)
  AND ($3::text IS NULL OR kind ILIKE '%' || $3 || '%' OR error ILIKE '%' || $3 || '%' OR payload::text ILIKE '%' || $3 || '%')
  AND ($6::timestamptz IS NULL OR (created_at, id) < ($6, $7::text))
ORDER BY created_at DESC, id DESC
LIMIT $4 OFFSET $5
