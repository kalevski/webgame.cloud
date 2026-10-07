UPDATE billing_event SET
    status = $2,
    error = $3,
    attempts = attempts + 1,
    applied_at = CASE WHEN $2 = 'applied' THEN now() ELSE applied_at END,
    updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
