INSERT INTO notifications (id, user_id, kind, title, link)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, user_id, kind, title, link, read_at, created_at
