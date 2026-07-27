SELECT * FROM api_keys
WHERE token_hash = $1 AND revoked_at IS NULL AND deleted_at IS NULL
  AND (expires_at IS NULL OR expires_at > now())
