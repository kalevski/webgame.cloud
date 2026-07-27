UPDATE api_keys SET last_used_at = now(), updated_at = now()
WHERE id = $1 AND (last_used_at IS NULL OR last_used_at < now() - interval '1 minute')
