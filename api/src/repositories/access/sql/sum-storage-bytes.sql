SELECT coalesce(sum(a.size_bytes), 0)::bigint AS c
FROM assets a
JOIN projects p ON p.id = a.project_id AND p.deleted_at IS NULL
WHERE p.owner_id = $1 AND a.upload_status = 'ready' AND a.deleted_at IS NULL
