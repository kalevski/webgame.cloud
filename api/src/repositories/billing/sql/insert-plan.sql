INSERT INTO billing_plans (id, name, description, role_id, mode, price_cents, currency, interval, position, active, features, sales_fields)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    role_id = EXCLUDED.role_id,
    mode = EXCLUDED.mode,
    price_cents = EXCLUDED.price_cents,
    currency = EXCLUDED.currency,
    interval = EXCLUDED.interval,
    position = EXCLUDED.position,
    active = EXCLUDED.active,
    features = EXCLUDED.features,
    sales_fields = EXCLUDED.sales_fields,
    deleted_at = NULL,
    updated_at = now()
WHERE billing_plans.deleted_at IS NOT NULL
