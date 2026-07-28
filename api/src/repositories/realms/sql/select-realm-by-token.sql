SELECT r.* FROM realms r WHERE r.token_hash = $1 AND r.deleted_at IS NULL
