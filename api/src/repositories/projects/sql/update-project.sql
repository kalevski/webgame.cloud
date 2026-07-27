UPDATE projects
SET name = $2, description = $3, visibility = $4,
    icon = $5, color = $6, priority = $7, due_date = $8, notify_on_activity = $9,
    updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
