SELECT resource, sum(quantity)::int AS total
FROM usage_events
WHERE user_id = $1 AND deleted_at IS NULL AND occurred_at >= $2 AND occurred_at < $3
GROUP BY resource
ORDER BY resource
