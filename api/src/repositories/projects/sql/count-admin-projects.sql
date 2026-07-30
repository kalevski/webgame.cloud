SELECT count(*)::int AS c
FROM projects p
JOIN users o ON o.id = p.owner_id AND o.deleted_at IS NULL
WHERE p.deleted_at IS NULL
  AND ($1::text = 'all'
       OR ($1::text = 'archived' AND p.archived_at IS NOT NULL)
       OR ($1::text = 'active' AND p.archived_at IS NULL))
  AND ($2::text = '' OR p.name ILIKE '%' || $2::text || '%' OR o.email ILIKE '%' || $2::text || '%' OR o.name ILIKE '%' || $2::text || '%')
  AND ($3::text = '' OR p.app_type = $3::text)
  AND ($4::text = '' OR p.realm_id = $4::text)
