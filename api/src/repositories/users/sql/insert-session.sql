INSERT INTO sessions (id, token_hash, user_id, user_agent, ip, expires_at, impersonated_by)
VALUES ($1, $2, $3, $4, $5, now() + make_interval(days => $6), $7)
