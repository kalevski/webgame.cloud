SELECT id, name, builtin, position, applicable, application_prompt
FROM roles
WHERE deleted_at IS NULL
ORDER BY position, name
