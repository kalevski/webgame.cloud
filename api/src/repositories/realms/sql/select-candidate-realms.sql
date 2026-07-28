SELECT r.*,
    (SELECT count(*) FROM projects p WHERE p.realm_id = r.id AND p.deleted_at IS NULL) AS project_count
FROM realms r
WHERE r.deleted_at IS NULL
  AND NOT r.exclusive
  AND r.status = 'active'
  AND r.health <> 'unhealthy'
  AND r.last_seen_at IS NOT NULL
  AND r.last_seen_at > now() - make_interval(secs => $2)
  AND (r.plan_id IS NULL OR r.plan_id = $1)
ORDER BY (r.plan_id IS NULL), project_count, r.name
