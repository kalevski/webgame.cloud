SELECT r.*,
    g.name AS region_name,
    (SELECT count(*) FROM projects p WHERE p.realm_id = r.id AND p.deleted_at IS NULL) AS project_count,
    (SELECT coalesce(sum(a.size_bytes), 0)
        FROM assets a
        JOIN projects p ON p.id = a.project_id AND p.deleted_at IS NULL
        WHERE p.realm_id = r.id AND a.upload_status = 'ready' AND a.deleted_at IS NULL) AS storage_used_bytes,
    (SELECT max(s.cpu_usage) FROM realm_samples s
        WHERE s.realm_id = r.id AND s.deleted_at IS NULL
          AND s.created_at >= now() - ($1::int * interval '1 hour')) AS peak_cpu_usage,
    (SELECT max(s.memory_used_bytes) FROM realm_samples s
        WHERE s.realm_id = r.id AND s.deleted_at IS NULL
          AND s.created_at >= now() - ($1::int * interval '1 hour')) AS peak_memory_used_bytes
FROM realms r
LEFT JOIN realm_regions g ON g.id = r.region_id AND g.deleted_at IS NULL
WHERE r.deleted_at IS NULL
ORDER BY r.name
