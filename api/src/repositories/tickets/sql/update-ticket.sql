UPDATE tickets
SET status = $2, assignee_id = $3, updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
