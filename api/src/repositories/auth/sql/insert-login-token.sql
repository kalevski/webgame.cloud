INSERT INTO login_tokens (id, email, token_hash, ip, expires_at)
VALUES ($1, $2, $3, $4, now() + make_interval(mins => $5))
RETURNING *
