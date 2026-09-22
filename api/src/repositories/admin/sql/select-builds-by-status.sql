SELECT status, count(*) AS count
FROM builds
WHERE deleted_at IS NULL
GROUP BY status
ORDER BY count(*) DESC
