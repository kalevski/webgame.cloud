SELECT id, name, application_prompt
FROM roles
WHERE applicable AND deleted_at IS NULL AND id <> 'owner'
ORDER BY position, name
