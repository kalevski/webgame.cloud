SELECT count(*) FROM users WHERE role = 'owner' AND active AND deleted_at IS NULL
