INSERT INTO webhook_endpoints (id, url, secret, description, events, active)
VALUES ($1, $2, $3, $4, $5::jsonb, $6)
RETURNING id
