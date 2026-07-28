UPDATE build_files SET deleted_at = now(), updated_at = now()
WHERE build_id = $1 AND deleted_at IS NULL
