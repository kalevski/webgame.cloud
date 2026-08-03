INSERT INTO users (id, email, name, picture, role, kind)
VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
