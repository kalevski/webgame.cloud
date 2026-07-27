SELECT i.*, u.email AS user_email, u.name AS user_name, p.name AS plan_name
FROM invoices i
JOIN users u ON u.id = i.user_id AND u.deleted_at IS NULL
LEFT JOIN billing_plans p ON p.id = i.plan_id AND p.deleted_at IS NULL
WHERE i.id = $1 AND i.deleted_at IS NULL
