SELECT u.* FROM sessions s
JOIN users u ON u.id = s.user_id AND u.deleted_at IS NULL
WHERE s.id = $1 AND s.expires_at > now() AND s.deleted_at IS NULL AND u.active
