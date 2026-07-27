INSERT INTO sessions (id, public_id, user_id, user_agent, ip, expires_at)
VALUES ($1, $2, $3, $4, $5, now() + make_interval(days => $6))
