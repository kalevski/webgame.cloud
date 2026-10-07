INSERT INTO invoices (id, number, public_token, user_id, plan_id, status, provider, provider_invoice_id, amount_cents, discount_cents, credit_cents, currency, due_at, paid_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
ON CONFLICT (provider, provider_invoice_id) WHERE provider_invoice_id <> '' AND deleted_at IS NULL
DO NOTHING
RETURNING id
