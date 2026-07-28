SELECT m.* FROM project_members m
WHERE m.project_id = $1 AND m.user_id = $2 AND m.deleted_at IS NULL
