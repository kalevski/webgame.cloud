INSERT INTO ticket_messages (id, ticket_id, author_id, body, internal)
VALUES ($1, $2, $3, $4, $5)
RETURNING id
