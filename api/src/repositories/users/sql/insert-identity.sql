INSERT INTO user_identities (user_id, provider, subject, email)
VALUES ($1, $2, $3, $4)
ON CONFLICT (provider, subject) DO UPDATE
SET user_id = EXCLUDED.user_id, email = EXCLUDED.email, deleted_at = NULL, updated_at = now()
RETURNING *
