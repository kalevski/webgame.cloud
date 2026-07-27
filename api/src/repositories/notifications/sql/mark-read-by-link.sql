UPDATE notifications SET read_at = now(), updated_at = now()
WHERE user_id = $1 AND kind = $2 AND link = $3 AND read_at IS NULL AND deleted_at IS NULL
