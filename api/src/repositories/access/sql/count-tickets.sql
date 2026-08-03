SELECT count(*) AS c FROM tickets
WHERE owner_id = $1 AND status IN ('open', 'in_progress', 'waiting_on_user') AND deleted_at IS NULL
