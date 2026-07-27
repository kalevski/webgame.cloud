INSERT INTO files (id, file_type, source_id, location, owner_id, original_name, mime, size)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING id
