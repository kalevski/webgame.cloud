UPDATE reports SET status = 'resolved', resolved_by = $2, resolved_at = now(), resolution = $3,
    updated_at = now()
WHERE id = $1 AND status = 'pending' AND deleted_at IS NULL
