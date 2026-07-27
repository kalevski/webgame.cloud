SELECT count(*) AS c FROM subscriptions
WHERE plan_id = $1 AND status IN ('trialing', 'active') AND deleted_at IS NULL
