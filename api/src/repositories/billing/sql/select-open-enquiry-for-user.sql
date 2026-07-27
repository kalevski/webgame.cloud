SELECT e.*, u.email AS user_email, u.name AS user_name, p.name AS plan_name
FROM sales_enquiries e
JOIN users u ON u.id = e.user_id AND u.deleted_at IS NULL
LEFT JOIN billing_plans p ON p.id = e.plan_id AND p.deleted_at IS NULL
WHERE e.user_id = $1 AND e.status IN ('new', 'contacted') AND e.deleted_at IS NULL
ORDER BY e.created_at DESC
LIMIT 1
