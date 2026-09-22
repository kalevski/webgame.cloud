UPDATE sessions SET deleted_at = now(), updated_at = now() WHERE token_hash = $1 AND deleted_at IS NULL
