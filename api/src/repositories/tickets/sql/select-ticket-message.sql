SELECT m.*, u.name AS author_name
FROM ticket_messages m
LEFT JOIN users u ON u.id = m.author_id AND u.deleted_at IS NULL
WHERE m.id = $1 AND m.deleted_at IS NULL
