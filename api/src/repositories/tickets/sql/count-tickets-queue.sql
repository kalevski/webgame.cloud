SELECT count(*)::int AS c
FROM tickets t
JOIN users o ON o.id = t.owner_id AND o.deleted_at IS NULL
WHERE t.deleted_at IS NULL
  AND ($1::text IS NULL OR t.status = $1)
  AND ($2::text IS NULL OR t.assignee_id = $2)
  AND ($3::text IS NULL OR t.subject ILIKE '%' || $3 || '%')
