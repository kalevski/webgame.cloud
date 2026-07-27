INSERT INTO api_keys (id, owner_id, name, prefix, token_hash, scopes, expires_at)
VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
RETURNING *
