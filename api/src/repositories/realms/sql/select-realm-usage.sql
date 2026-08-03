SELECT
    (SELECT coalesce(sum(a.size_bytes), 0)
        FROM assets a
        JOIN projects p ON p.id = a.project_id AND p.deleted_at IS NULL
        WHERE p.realm_id = $1 AND a.upload_status = 'ready' AND a.deleted_at IS NULL) AS storage_used_bytes,
    (SELECT count(*)
        FROM assets a
        JOIN projects p ON p.id = a.project_id AND p.deleted_at IS NULL
        WHERE p.realm_id = $1 AND a.upload_status = 'ready'
          AND a.finalized_at >= date_trunc('day', now()) AND a.deleted_at IS NULL) AS files_processed_today,
    (SELECT count(*)
        FROM builds b
        WHERE b.realm_id = $1 AND b.status IN ('done', 'failed')
          AND b.finished_at >= date_trunc('day', now()) AND b.deleted_at IS NULL) AS builds_today,
    (SELECT count(*)
        FROM builds b
        WHERE b.realm_id = $1 AND b.status IN ('done', 'failed')
          AND b.finished_at >= now() - interval '7 days' AND b.deleted_at IS NULL) AS builds_week
