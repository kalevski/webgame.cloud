UPDATE realms
SET health = $2, disk_free_bytes = $3, queue_depth = $4, last_seen_at = now(), updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
