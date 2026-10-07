SELECT i.*, u.email AS user_email, u.name AS user_name, p.name AS plan_name
FROM invoices i
JOIN users u ON u.id = i.user_id AND u.deleted_at IS NULL
LEFT JOIN billing_plans p ON p.id = i.plan_id AND p.deleted_at IS NULL
WHERE i.status = 'open' AND i.deleted_at IS NULL
  AND i.provider = 'manual'
  AND i.due_at IS NOT NULL AND i.due_at <= now() - make_interval(days => $1)
  AND NOT EXISTS (
      SELECT 1 FROM invoice_reminders r
      WHERE r.invoice_id = i.id AND r.stage = $2 AND r.deleted_at IS NULL
  )
ORDER BY i.due_at
LIMIT 100
