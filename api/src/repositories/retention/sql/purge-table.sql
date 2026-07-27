DELETE FROM {{table}}
WHERE ctid IN (
    SELECT ctid FROM {{table}}
    WHERE deleted_at IS NOT NULL
      AND deleted_at < now() - make_interval(days => $1)
    LIMIT $2
)
