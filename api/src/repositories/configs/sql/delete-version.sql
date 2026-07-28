UPDATE config_versions SET deleted_at = now(), updated_at = now()
WHERE config_id = $1 AND build_tag = $2 AND deleted_at IS NULL
