WITH deleted_messages AS (
    UPDATE ticket_messages SET deleted_at = now(), updated_at = now()
    WHERE ticket_id = $1 AND deleted_at IS NULL RETURNING id
)
UPDATE tickets SET deleted_at = now(), updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
