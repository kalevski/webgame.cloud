INSERT INTO assets (
    id, project_id, uploaded_by, parent_asset_id, kind, category_id,
    name, extension, mime, size_bytes, tags, upload_uuid
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
RETURNING id
