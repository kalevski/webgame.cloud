INSERT INTO webhook_deliveries (id, endpoint_id, action, payload)
VALUES ($1, $2, $3, $4::jsonb)
RETURNING id
