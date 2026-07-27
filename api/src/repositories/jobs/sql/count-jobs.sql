SELECT count(*) AS c FROM jobs
WHERE deleted_at IS NULL
  AND ($1::text IS NULL OR status = $1)
  AND ($2::text IS NULL OR kind = $2)
  AND ($3::text IS NULL OR kind ILIKE '%' || $3 || '%' OR error ILIKE '%' || $3 || '%' OR payload::text ILIKE '%' || $3 || '%')
