INSERT INTO frame_templates (id, owner_id, name, description, format, background, layers, fields)
VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb)
RETURNING id
