UPDATE email_templates SET deleted_at = now(), updated_at = now()
WHERE key = $1 AND deleted_at IS NULL
