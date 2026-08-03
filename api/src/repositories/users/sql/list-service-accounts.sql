SELECT u.*,
       (SELECT count(*) FROM api_keys k
         WHERE k.owner_id = u.id AND k.revoked_at IS NULL AND k.deleted_at IS NULL) AS key_count,
       (SELECT max(k.last_used_at) FROM api_keys k
         WHERE k.owner_id = u.id AND k.deleted_at IS NULL) AS last_used_at
FROM users u
WHERE u.kind = 'service' AND u.deleted_at IS NULL
ORDER BY u.created_at DESC
