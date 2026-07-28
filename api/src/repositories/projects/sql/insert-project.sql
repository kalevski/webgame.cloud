INSERT INTO projects (id, owner_id, realm_id, name, description, app_type, icon, color)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING id
