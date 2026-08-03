INSERT INTO tickets (id, owner_id, subject)
VALUES ($1, $2, $3)
RETURNING id
