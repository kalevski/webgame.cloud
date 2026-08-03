SELECT t.*,
       o.name AS owner_name,
       a.name AS assignee_name,
       (SELECT count(*) FROM ticket_messages m WHERE m.ticket_id = t.id AND m.deleted_at IS NULL) AS message_count
FROM tickets t
JOIN users o ON o.id = t.owner_id AND o.deleted_at IS NULL
LEFT JOIN users a ON a.id = t.assignee_id AND a.deleted_at IS NULL
WHERE t.owner_id = $1 AND t.deleted_at IS NULL
ORDER BY t.last_message_at DESC, t.id
