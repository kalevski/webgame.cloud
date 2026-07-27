UPDATE invoices SET
    status = $2,
    paid_at = CASE WHEN $2 = 'paid' THEN COALESCE(paid_at, now()) ELSE NULL END,
    updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
