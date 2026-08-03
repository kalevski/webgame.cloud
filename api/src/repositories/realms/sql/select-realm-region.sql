SELECT g.*,
    (SELECT count(*) FROM realms r WHERE r.region_id = g.id AND r.deleted_at IS NULL) AS realm_count
FROM realm_regions g
WHERE g.id = $1 AND g.deleted_at IS NULL
