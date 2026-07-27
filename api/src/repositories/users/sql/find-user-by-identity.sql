SELECT u.* FROM users u
JOIN user_identities i ON i.user_id = u.id AND i.deleted_at IS NULL
WHERE i.provider = $1 AND i.subject = $2 AND u.deleted_at IS NULL
