WITH deleted_deliveries AS (
    UPDATE webhook_deliveries SET deleted_at = now(), updated_at = now()
    WHERE endpoint_id = $1 AND deleted_at IS NULL RETURNING id
)
UPDATE webhook_endpoints SET deleted_at = now(), updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
