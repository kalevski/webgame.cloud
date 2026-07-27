SELECT count(*)::int AS c FROM files WHERE source_id = $1 AND deleted_at IS NULL
