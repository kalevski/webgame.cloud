INSERT INTO billing_event (
    id, provider, provider_event_id, event_type,
    provider_subscription_id, user_id, object_at, payload
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
ON CONFLICT (provider, provider_event_id) WHERE deleted_at IS NULL
DO NOTHING
RETURNING id
