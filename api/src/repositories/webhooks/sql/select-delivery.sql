SELECT d.*, e.url AS endpoint_url, e.secret AS endpoint_secret
FROM webhook_deliveries d
JOIN webhook_endpoints e ON e.id = d.endpoint_id AND e.deleted_at IS NULL
WHERE d.id = $1 AND d.deleted_at IS NULL
