SELECT DISTINCT ON (kind) *
FROM jobs
WHERE deleted_at IS NULL AND kind = ANY($1::text[])
ORDER BY kind, created_at DESC
