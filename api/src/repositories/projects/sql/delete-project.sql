WITH deleted_tasks AS (
    UPDATE tasks SET deleted_at = now(), updated_at = now()
    WHERE project_id = $1 AND deleted_at IS NULL RETURNING id
)
UPDATE projects SET deleted_at = now(), updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
