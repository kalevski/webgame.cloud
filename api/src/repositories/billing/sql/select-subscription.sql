SELECT * FROM subscriptions WHERE user_id = $1 AND deleted_at IS NULL
