UPDATE role_applications SET
    status = 'withdrawn',
    updated_at = now()
WHERE id = $1 AND user_id = $2 AND status = 'pending' AND deleted_at IS NULL
