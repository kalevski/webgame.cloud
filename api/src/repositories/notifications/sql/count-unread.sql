SELECT count(*) FROM notifications WHERE user_id = $1 AND read_at IS NULL AND deleted_at IS NULL
