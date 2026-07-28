SELECT * FROM config_versions
WHERE config_id = $1 AND deleted_at IS NULL
ORDER BY is_default DESC, build_tag
