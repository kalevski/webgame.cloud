SELECT * FROM subscriptions
WHERE status IN ('trialing', 'active')
  AND provider <> 'manual'
  AND provider_subscription_id <> ''
  AND deleted_at IS NULL
  AND (
      current_period_end IS NULL
      OR current_period_end <= now() - interval '2 days'
      OR (cancel_at_period_end AND current_period_end <= now())
  )
