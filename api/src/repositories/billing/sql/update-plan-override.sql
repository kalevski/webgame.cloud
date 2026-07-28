INSERT INTO subscriptions (user_id, staff_override_plan_id, updated_at)
VALUES ($1, $2, now())
ON CONFLICT (user_id) DO UPDATE SET
    staff_override_plan_id = EXCLUDED.staff_override_plan_id,
    deleted_at = NULL,
    updated_at = now()
