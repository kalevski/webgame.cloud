UPDATE project_members SET deleted_at = now(), updated_at = now()
WHERE project_id = $1 AND user_id = $2 AND deleted_at IS NULL
