INSERT INTO usage_events (id, user_id, resource, quantity, occurred_at)
VALUES ($1, $2, $3, $4, COALESCE($5, now()))
