SELECT * FROM assets
WHERE project_id = $1
  AND deleted_at IS NULL
  AND ($2::text IS NULL OR category_id = $2)
  AND ($3::text IS NULL OR tags && ARRAY[$3]::text[])
  AND (($4::text IS NULL AND upload_status <> 'pending_upload') OR upload_status = $4)
ORDER BY created_at DESC
