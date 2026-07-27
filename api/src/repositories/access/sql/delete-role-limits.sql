UPDATE role_limits SET deleted_at = now(), updated_at = now() WHERE deleted_at IS NULL
