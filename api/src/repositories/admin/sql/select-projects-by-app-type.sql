SELECT app_type, count(*) AS count
FROM projects
WHERE deleted_at IS NULL
GROUP BY app_type
ORDER BY count(*) DESC
