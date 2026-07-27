UPDATE billing_plans SET
    name = COALESCE($2, name),
    description = COALESCE($3, description),
    role_id = CASE WHEN $4::boolean THEN $5 ELSE role_id END,
    mode = COALESCE($6, mode),
    price_cents = COALESCE($7, price_cents),
    currency = COALESCE($8, currency),
    interval = COALESCE($9, interval),
    position = COALESCE($10, position),
    active = COALESCE($11, active),
    features = COALESCE($12::jsonb, features),
    sales_fields = COALESCE($13::jsonb, sales_fields),
    updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
