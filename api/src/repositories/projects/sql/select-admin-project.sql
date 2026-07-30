SELECT p.*,
    o.name AS owner_name,
    o.email AS owner_email,
    r.name AS realm_name,
    (SELECT count(*) FROM project_members m WHERE m.project_id = p.id AND m.deleted_at IS NULL) AS member_count,
    (SELECT count(*) FROM assets a WHERE a.project_id = p.id AND a.upload_status = 'ready' AND a.deleted_at IS NULL) AS asset_count,
    (SELECT count(*) FROM builds b WHERE b.project_id = p.id AND b.deleted_at IS NULL) AS build_count,
    (SELECT coalesce(sum(a.size_bytes), 0) FROM assets a WHERE a.project_id = p.id AND a.upload_status = 'ready' AND a.deleted_at IS NULL) AS storage_bytes,
    (SELECT count(*) FROM project_migrations pm
        WHERE pm.project_id = p.id AND pm.deleted_at IS NULL
          AND pm.state NOT IN ('completed', 'failed')) AS lock_count
FROM projects p
JOIN users o ON o.id = p.owner_id AND o.deleted_at IS NULL
LEFT JOIN realms r ON r.id = p.realm_id AND r.deleted_at IS NULL
WHERE p.id = $1 AND p.deleted_at IS NULL
