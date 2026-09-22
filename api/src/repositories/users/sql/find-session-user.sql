SELECT u.*, s.impersonated_by FROM sessions s
JOIN users u ON u.id = s.user_id AND u.deleted_at IS NULL
WHERE s.token_hash = $1 AND s.expires_at > now() AND s.deleted_at IS NULL AND u.active
