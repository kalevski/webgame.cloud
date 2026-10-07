INSERT INTO billing_plans (id, name, description, role_id, visible_role_ids, mode, price_cents, currency, interval, position, active, features, sales_fields, trial_days, provider_product_id)
VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10, $11, $12::jsonb, $13::jsonb, $14, $15)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    role_id = EXCLUDED.role_id,
    visible_role_ids = EXCLUDED.visible_role_ids,
    mode = EXCLUDED.mode,
    price_cents = EXCLUDED.price_cents,
    currency = EXCLUDED.currency,
    interval = EXCLUDED.interval,
    position = EXCLUDED.position,
    active = EXCLUDED.active,
    features = EXCLUDED.features,
    sales_fields = EXCLUDED.sales_fields,
    trial_days = EXCLUDED.trial_days,
    provider_product_id = EXCLUDED.provider_product_id,
    deleted_at = NULL,
    updated_at = now()
WHERE billing_plans.deleted_at IS NOT NULL
