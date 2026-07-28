WITH gone_children AS (
    UPDATE assets SET deleted_at = now(), updated_at = now()
    WHERE parent_asset_id = $1 AND deleted_at IS NULL
    RETURNING id
)
UPDATE assets SET deleted_at = now(), updated_at = now()
WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL
