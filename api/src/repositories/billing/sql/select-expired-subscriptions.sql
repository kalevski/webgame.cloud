SELECT * FROM subscriptions
WHERE status IN ('trialing', 'active')
  AND current_period_end IS NOT NULL
  AND current_period_end <= now()
  AND deleted_at IS NULL
