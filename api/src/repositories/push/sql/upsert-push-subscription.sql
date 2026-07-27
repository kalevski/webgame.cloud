INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
VALUES ($1, $2, $3, $4)
ON CONFLICT (endpoint) DO UPDATE
SET user_id = EXCLUDED.user_id, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth,
    deleted_at = NULL, updated_at = now()
