UPDATE realms
SET name = $2, base_url = $3, region = $4, plan_id = $5, exclusive = $6, status = $7, updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
