UPDATE builds SET build_tag = '', updated_at = now()
WHERE bundle_id = $1 AND build_tag = $2 AND id <> $3 AND deleted_at IS NULL
