SELECT coalesce(sum(size_bytes), 0)::bigint AS c FROM assets
WHERE project_id = $1 AND upload_status = 'ready' AND deleted_at IS NULL
