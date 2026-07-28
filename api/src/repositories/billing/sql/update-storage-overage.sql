INSERT INTO subscriptions (user_id, storage_overage_bytes, storage_overage_flagged_at, updated_at)
VALUES ($1, $2, CASE WHEN $2::bigint > 0 THEN now() ELSE NULL END, now())
ON CONFLICT (user_id) DO UPDATE SET
    storage_overage_bytes = EXCLUDED.storage_overage_bytes,
    storage_overage_flagged_at = CASE
        WHEN EXCLUDED.storage_overage_bytes > 0
            THEN COALESCE(subscriptions.storage_overage_flagged_at, now())
        ELSE NULL
    END,
    updated_at = now()
