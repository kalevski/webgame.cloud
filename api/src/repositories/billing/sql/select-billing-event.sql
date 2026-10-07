SELECT e.*, u.email AS user_email, u.name AS user_name
FROM billing_event e
LEFT JOIN users u ON u.id = e.user_id AND u.deleted_at IS NULL
WHERE e.id = $1 AND e.deleted_at IS NULL
