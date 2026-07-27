UPDATE webhook_deliveries SET
    status = CASE WHEN attempts + 1 >= 5 THEN 'failed' ELSE 'pending' END,
    response_status = $2,
    attempts = attempts + 1,
    error = $3,
    updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
