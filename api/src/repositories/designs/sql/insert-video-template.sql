INSERT INTO video_templates (id, owner_id, name, description, format)
VALUES ($1, $2, $3, $4, $5)
RETURNING id
