UPDATE realm_samples SET deleted_at = now(), updated_at = now()
WHERE created_at < now() - ($1::int * interval '1 day') AND deleted_at IS NULL
