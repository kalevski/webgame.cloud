UPDATE sessions SET last_seen_at = now(), updated_at = now()
WHERE token_hash = $1 AND deleted_at IS NULL AND last_seen_at < now() - interval '1 minute'
