SELECT
    count(*)::bigint AS total,
    count(*) FILTER (WHERE deleted_at IS NOT NULL)::bigint AS soft_deleted,
    count(*) FILTER (
        WHERE $2::boolean
          AND deleted_at IS NOT NULL
          AND deleted_at < now() - make_interval(days => $1)
    )::bigint AS due
FROM {{table}}
