SELECT t.*, e.name AS template_name
FROM email_triggers t
LEFT JOIN email_templates e ON e.key = t.template_key AND e.deleted_at IS NULL
WHERE t.deleted_at IS NULL
ORDER BY t.action, t.created_at
