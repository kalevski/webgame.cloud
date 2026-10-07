SELECT * FROM billing_plans
WHERE provider_product_id = $1 AND provider_product_id <> '' AND deleted_at IS NULL
