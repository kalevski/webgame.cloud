SELECT
    (SELECT count(*) FROM users
     WHERE kind = 'human' AND deleted_at IS NULL) AS signups_total,
    (SELECT count(*) FROM users
     WHERE kind = 'human' AND deleted_at IS NULL
       AND created_at > now() - interval '30 days') AS signups_last_30,
    (SELECT count(*) FROM users
     WHERE kind = 'human' AND deleted_at IS NULL
       AND last_seen_at > now() - interval '7 days') AS wau,
    (SELECT count(*) FROM users
     WHERE kind = 'human' AND deleted_at IS NULL
       AND created_at BETWEEN now() - interval '37 days' AND now() - interval '30 days') AS cohort_size,
    (SELECT count(*) FROM users
     WHERE kind = 'human' AND deleted_at IS NULL
       AND created_at BETWEEN now() - interval '37 days' AND now() - interval '30 days'
       AND last_seen_at > now() - interval '7 days') AS cohort_active,
    (SELECT count(*) FROM projects
     WHERE deleted_at IS NULL) AS projects_total,
    (SELECT count(*) FROM projects
     WHERE deleted_at IS NULL
       AND created_at > now() - interval '30 days') AS projects_last_30,
    (SELECT count(*) FROM builds
     WHERE deleted_at IS NULL) AS builds_total
