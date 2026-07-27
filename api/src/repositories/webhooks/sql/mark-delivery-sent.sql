UPDATE webhook_deliveries SET status = 'delivered', response_status = $2, attempts = attempts + 1,
    error = '', delivered_at = now(), updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
