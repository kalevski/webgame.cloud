SELECT * FROM billing_plans WHERE active AND deleted_at IS NULL ORDER BY position, id
