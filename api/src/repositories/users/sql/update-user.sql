UPDATE users
SET role = COALESCE($2, role), active = COALESCE($3, active),
    verified = COALESCE($4, verified), updated_at = now()
WHERE id = $1 AND deleted_at IS NULL RETURNING *
