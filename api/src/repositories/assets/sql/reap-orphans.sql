WITH doomed AS (
    SELECT id FROM assets
    WHERE upload_status = 'pending_upload' AND deleted_at IS NULL
      AND created_at < now() - interval '20 minutes'
    ORDER BY created_at LIMIT $1 FOR UPDATE SKIP LOCKED
)
UPDATE assets SET deleted_at = now(), updated_at = now()
WHERE id IN (SELECT id FROM doomed)
RETURNING id
