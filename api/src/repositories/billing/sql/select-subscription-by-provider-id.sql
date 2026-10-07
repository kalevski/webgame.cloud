SELECT * FROM subscriptions
WHERE provider = $1 AND provider_subscription_id = $2 AND provider_subscription_id <> '' AND deleted_at IS NULL
