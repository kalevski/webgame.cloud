UPDATE sessions SET deleted_at = now(), updated_at = now()
WHERE expires_at <= now() AND deleted_at IS NULL
