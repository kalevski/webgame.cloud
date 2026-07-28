INSERT INTO realms (id, name, base_url, region, plan_id, exclusive, status, token_hash)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING id
