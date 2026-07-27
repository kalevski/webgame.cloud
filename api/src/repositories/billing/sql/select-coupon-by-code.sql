SELECT * FROM coupons
WHERE lower(code) = lower($1) AND active AND deleted_at IS NULL
  AND (expires_at IS NULL OR expires_at > now())
  AND (max_redemptions IS NULL OR redeemed < max_redemptions)
