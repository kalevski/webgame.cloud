INSERT INTO role_applications (id, user_id, role_id, message)
VALUES ($1, $2, $3, $4)
RETURNING id
