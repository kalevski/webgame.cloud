SELECT * FROM sessions
WHERE user_id = $1 AND expires_at > now() AND deleted_at IS NULL
ORDER BY last_seen_at DESC
