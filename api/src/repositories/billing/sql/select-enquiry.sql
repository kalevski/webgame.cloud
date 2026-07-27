SELECT e.*, u.email AS user_email, u.name AS user_name, p.name AS plan_name
FROM sales_enquiries e
JOIN users u ON u.id = e.user_id AND u.deleted_at IS NULL
LEFT JOIN billing_plans p ON p.id = e.plan_id AND p.deleted_at IS NULL
WHERE e.id = $1 AND e.deleted_at IS NULL
