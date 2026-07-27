INSERT INTO subscriptions (
    user_id, plan_id, status, provider,
    provider_customer_id, provider_subscription_id,
    cancel_at_period_end, current_period_end, started_at, updated_at
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())
ON CONFLICT (user_id) DO UPDATE SET
    plan_id = EXCLUDED.plan_id,
    status = EXCLUDED.status,
    provider = EXCLUDED.provider,
    provider_customer_id = EXCLUDED.provider_customer_id,
    provider_subscription_id = EXCLUDED.provider_subscription_id,
    cancel_at_period_end = EXCLUDED.cancel_at_period_end,
    current_period_end = EXCLUDED.current_period_end,
    started_at = COALESCE(subscriptions.started_at, EXCLUDED.started_at),
    deleted_at = NULL,
    updated_at = now()
