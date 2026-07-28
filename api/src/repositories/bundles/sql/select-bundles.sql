SELECT b.*,
    (SELECT count(*) FROM assets a
        WHERE a.project_id = b.project_id AND a.upload_status = 'ready' AND a.deleted_at IS NULL
          AND (b.category_id IS NULL OR a.category_id = b.category_id)
          AND (cardinality(b.included_tags) = 0 OR a.tags && b.included_tags)
          AND NOT (a.tags && b.excluded_tags)) AS asset_count,
    (SELECT count(*) FROM builds bd WHERE bd.bundle_id = b.id AND bd.deleted_at IS NULL) AS build_count
FROM bundles b
WHERE b.project_id = $1 AND b.deleted_at IS NULL
ORDER BY b.name
