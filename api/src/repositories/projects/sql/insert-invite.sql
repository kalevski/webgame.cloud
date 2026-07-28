INSERT INTO project_invites (id, project_id, email, user_id, permissions, invited_by, expires_at)
VALUES ($1, $2, $3, $4, $5, $6, now() + interval '7 days')
RETURNING id
