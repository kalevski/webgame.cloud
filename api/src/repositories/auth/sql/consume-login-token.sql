UPDATE login_tokens SET consumed_at = now(), updated_at = now()
WHERE token_hash = $1 AND consumed_at IS NULL AND expires_at > now() AND deleted_at IS NULL
RETURNING *
