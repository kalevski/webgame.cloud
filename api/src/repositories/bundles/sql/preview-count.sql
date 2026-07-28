SELECT count(*) AS c, coalesce(sum(f.size_bytes), 0)::bigint AS total_bytes
FROM assets f
WHERE f.project_id = $1 AND f.upload_status = 'ready' AND f.deleted_at IS NULL
  AND ($2::text IS NULL OR f.category_id = $2)
  AND (cardinality($3::text[]) = 0 OR f.tags && $3)
  AND NOT (f.tags && $4::text[])
