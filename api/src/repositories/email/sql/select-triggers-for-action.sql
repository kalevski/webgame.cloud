SELECT t.*, e.name AS template_name
FROM email_triggers t
JOIN email_templates e ON e.key = t.template_key AND e.deleted_at IS NULL
WHERE t.active AND e.active AND t.action = $1 AND t.deleted_at IS NULL
