SELECT storage_path FROM assets
WHERE project_id = $1 AND storage_path <> '' AND deleted_at IS NULL
