WITH gone_files AS (
    UPDATE build_files SET deleted_at = now(), updated_at = now()
    WHERE build_id = $1 AND deleted_at IS NULL
    RETURNING id
)
UPDATE builds SET deleted_at = now(), updated_at = now()
WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL
