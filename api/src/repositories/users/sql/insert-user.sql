INSERT INTO users (id, email, name, picture, role)
VALUES ($1, $2, $3, $4, $5) RETURNING *
