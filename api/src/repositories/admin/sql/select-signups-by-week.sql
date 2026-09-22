SELECT to_char(w.week, 'YYYY-MM-DD') AS week, count(u.id) AS count
FROM generate_series(
    date_trunc('week', now()) - interval '11 weeks',
    date_trunc('week', now()),
    interval '1 week'
) AS w(week)
LEFT JOIN users u
    ON date_trunc('week', u.created_at) = w.week
   AND u.kind = 'human'
   AND u.deleted_at IS NULL
GROUP BY w.week ORDER BY w.week
