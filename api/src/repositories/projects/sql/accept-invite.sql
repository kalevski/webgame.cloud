UPDATE project_invites SET accepted_at = now(), deleted_at = now(), updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
