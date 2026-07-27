WITH redemption AS (
    INSERT INTO coupon_redemptions (id, coupon_id, user_id, invoice_id)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (coupon_id, user_id) WHERE deleted_at IS NULL DO NOTHING
    RETURNING id
)
UPDATE coupons SET redeemed = redeemed + 1, updated_at = now()
WHERE id = $2 AND EXISTS (SELECT 1 FROM redemption)
RETURNING *
