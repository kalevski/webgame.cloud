UPDATE login_tokens SET deleted_at = now(), updated_at = now()
WHERE deleted_at IS NULL AND (expires_at <= now() OR consumed_at IS NOT NULL)
