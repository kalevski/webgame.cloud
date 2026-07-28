UPDATE builds
SET status = $3,
    artifact_url = $4,
    manifest_url = $5,
    checksum = $6,
    size_bytes = $7,
    duration_ms = $8,
    error = $9,
    finished_at = now(),
    updated_at = now()
WHERE id = $1 AND realm_id = $2 AND deleted_at IS NULL
