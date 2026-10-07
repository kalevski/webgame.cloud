UPDATE billing_plans SET
    name = COALESCE($2, name),
    description = COALESCE($3, description),
    role_id = CASE WHEN $4::boolean THEN $5 ELSE role_id END,
    visible_role_ids = COALESCE($6::jsonb, visible_role_ids),
    mode = COALESCE($7, mode),
    price_cents = COALESCE($8, price_cents),
    currency = COALESCE($9, currency),
    interval = COALESCE($10, interval),
    position = COALESCE($11, position),
    active = COALESCE($12, active),
    features = COALESCE($13::jsonb, features),
    sales_fields = COALESCE($14::jsonb, sales_fields),
    trial_days = COALESCE($15, trial_days),
    provider_product_id = COALESCE($16, provider_product_id),
    updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
