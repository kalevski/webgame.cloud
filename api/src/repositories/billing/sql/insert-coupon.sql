INSERT INTO coupons (id, code, percent_off, amount_off, currency, duration_months, max_redemptions, expires_at, active)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING *
