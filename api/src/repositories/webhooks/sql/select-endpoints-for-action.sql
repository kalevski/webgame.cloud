SELECT * FROM webhook_endpoints
WHERE active AND deleted_at IS NULL AND events @> to_jsonb($1::text)
