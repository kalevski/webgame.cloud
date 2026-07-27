SELECT id, name, builtin, position FROM roles WHERE deleted_at IS NULL ORDER BY position, name
