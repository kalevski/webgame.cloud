UPDATE role_applications SET
    status = $2,
    decision_note = $3,
    decided_by = $4,
    decided_at = now(),
    updated_at = now()
WHERE id = $1 AND status = 'pending' AND deleted_at IS NULL
