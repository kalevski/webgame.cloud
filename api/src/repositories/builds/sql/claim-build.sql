UPDATE builds SET status = 'running', claimed_at = now(), updated_at = now()
WHERE id = (
    SELECT b.id FROM builds b
    WHERE b.realm_id = $1 AND b.status = 'pending' AND b.deleted_at IS NULL
      AND b.project_id NOT IN (
          SELECT project_id FROM project_migrations
          WHERE state NOT IN ('completed', 'failed') AND deleted_at IS NULL
      )
    ORDER BY b.created_at
    LIMIT 1 FOR UPDATE SKIP LOCKED
)
RETURNING *
