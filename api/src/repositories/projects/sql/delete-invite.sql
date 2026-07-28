UPDATE project_invites SET deleted_at = now(), updated_at = now()
WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL
