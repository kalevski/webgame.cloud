SELECT b.id, b.build_tag, b.checksum,
    coalesce(json_agg(json_build_object(
        'group', f.group_name, 'name', f.name, 'url', f.url,
        'sizeBytes', f.size_bytes, 'checksum', f.checksum
    ) ORDER BY f.group_name, f.name) FILTER (WHERE f.id IS NOT NULL), '[]'::json) AS files
FROM builds b
LEFT JOIN build_files f ON f.build_id = b.id AND f.deleted_at IS NULL
WHERE b.project_id = $1 AND b.deleted_at IS NULL AND b.status = 'done'
  AND (($2::text IS NOT NULL AND b.id = $2) OR ($2::text IS NULL AND b.build_tag = $3))
GROUP BY b.id
ORDER BY b.created_at DESC
LIMIT 1
