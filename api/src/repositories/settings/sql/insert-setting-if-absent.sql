INSERT INTO settings (key, value) VALUES ($1, $2)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value, deleted_at = NULL, updated_at = now()
WHERE settings.deleted_at IS NOT NULL
