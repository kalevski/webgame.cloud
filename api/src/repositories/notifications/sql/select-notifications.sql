SELECT id, user_id, kind, title, link, read_at, created_at
FROM notifications
WHERE user_id = $1 AND deleted_at IS NULL
ORDER BY created_at DESC, id
LIMIT $2
