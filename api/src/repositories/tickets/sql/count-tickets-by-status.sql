SELECT t.status, count(*)::int AS c
FROM tickets t
JOIN users o ON o.id = t.owner_id AND o.deleted_at IS NULL
WHERE t.deleted_at IS NULL
GROUP BY t.status
