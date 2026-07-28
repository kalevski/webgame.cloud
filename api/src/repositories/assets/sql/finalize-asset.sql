UPDATE assets
SET upload_status = $2,
    size_bytes = $3,
    checksum = $4,
    storage_path = $5,
    finalized_at = now(),
    updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
