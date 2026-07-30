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
WHERE p.deleted_at IS NULL
  AND ($1::text = 'all'
       OR ($1::text = 'archived' AND p.archived_at IS NOT NULL)
       OR ($1::text = 'active' AND p.archived_at IS NULL))
  AND ($2::text = '' OR p.name ILIKE '%' || $2::text || '%' OR o.email ILIKE '%' || $2::text || '%' OR o.name ILIKE '%' || $2::text || '%')
  AND ($3::text = '' OR p.app_type = $3::text)
  AND ($4::text = '' OR p.realm_id = $4::text)
ORDER BY
    CASE WHEN $5::text = 'name' AND $6::text = 'asc' THEN lower(p.name) END ASC,
    CASE WHEN $5::text = 'name' AND $6::text = 'desc' THEN lower(p.name) END DESC,
    CASE WHEN $5::text = 'owner' AND $6::text = 'asc' THEN lower(o.email) END ASC,
    CASE WHEN $5::text = 'owner' AND $6::text = 'desc' THEN lower(o.email) END DESC,
    CASE WHEN $5::text = 'members' AND $6::text = 'asc' THEN (SELECT count(*) FROM project_members m WHERE m.project_id = p.id AND m.deleted_at IS NULL) END ASC,
    CASE WHEN $5::text = 'members' AND $6::text = 'desc' THEN (SELECT count(*) FROM project_members m WHERE m.project_id = p.id AND m.deleted_at IS NULL) END DESC,
    CASE WHEN $5::text = 'assets' AND $6::text = 'asc' THEN (SELECT count(*) FROM assets a WHERE a.project_id = p.id AND a.upload_status = 'ready' AND a.deleted_at IS NULL) END ASC,
    CASE WHEN $5::text = 'assets' AND $6::text = 'desc' THEN (SELECT count(*) FROM assets a WHERE a.project_id = p.id AND a.upload_status = 'ready' AND a.deleted_at IS NULL) END DESC,
    CASE WHEN $5::text = 'storage' AND $6::text = 'asc' THEN (SELECT coalesce(sum(a.size_bytes), 0) FROM assets a WHERE a.project_id = p.id AND a.upload_status = 'ready' AND a.deleted_at IS NULL) END ASC,
    CASE WHEN $5::text = 'storage' AND $6::text = 'desc' THEN (SELECT coalesce(sum(a.size_bytes), 0) FROM assets a WHERE a.project_id = p.id AND a.upload_status = 'ready' AND a.deleted_at IS NULL) END DESC,
    CASE WHEN $5::text = 'created' AND $6::text = 'asc' THEN p.created_at END ASC,
    p.created_at DESC
LIMIT $7 OFFSET $8
