SELECT t.*,
       o.name AS owner_name,
       a.name AS assignee_name,
       (SELECT count(*) FROM ticket_messages m WHERE m.ticket_id = t.id AND m.deleted_at IS NULL) AS message_count
FROM tickets t
JOIN users o ON o.id = t.owner_id AND o.deleted_at IS NULL
LEFT JOIN users a ON a.id = t.assignee_id AND a.deleted_at IS NULL
WHERE t.deleted_at IS NULL
  AND ($1::text IS NULL OR t.status = $1)
  AND ($2::text IS NULL OR t.assignee_id = $2)
  AND ($3::text IS NULL OR t.subject ILIKE '%' || $3 || '%')
ORDER BY t.last_message_at DESC, t.id
LIMIT $4 OFFSET $5
