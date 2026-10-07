UPDATE billing_event SET
    status = 'received',
    error = '',
    updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
