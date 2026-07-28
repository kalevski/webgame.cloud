SELECT b.*,
    (SELECT count(*) FROM builds bd WHERE bd.bundle_id = b.id AND bd.deleted_at IS NULL) AS build_count
FROM bundles b
WHERE b.id = $1 AND b.deleted_at IS NULL
