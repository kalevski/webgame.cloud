UPDATE push_subscriptions SET deleted_at = now(), updated_at = now()
WHERE endpoint = $1 AND deleted_at IS NULL
