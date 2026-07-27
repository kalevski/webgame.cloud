INSERT INTO reports (id, reporter_id, target_kind, target_id, target_label, reason)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id
