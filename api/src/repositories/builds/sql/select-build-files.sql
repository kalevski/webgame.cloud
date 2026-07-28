SELECT * FROM build_files WHERE build_id = $1 AND deleted_at IS NULL ORDER BY group_name, name
