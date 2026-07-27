INSERT INTO projects (id, owner_id, name, description, visibility, icon, color, priority, due_date, notify_on_activity)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING id
