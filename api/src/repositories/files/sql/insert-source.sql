INSERT INTO file_sources (id, name, type, config, secret)
VALUES ($1, $2, $3, $4::jsonb, $5)
RETURNING id
