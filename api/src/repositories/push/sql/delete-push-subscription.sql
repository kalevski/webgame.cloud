UPDATE push_subscriptions SET deleted_at = now(), updated_at = now()
WHERE user_id = $1 AND endpoint = $2 AND deleted_at IS NULL
