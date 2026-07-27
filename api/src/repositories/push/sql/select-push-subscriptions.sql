SELECT user_id, endpoint, p256dh, auth FROM push_subscriptions
WHERE user_id = $1 AND deleted_at IS NULL
