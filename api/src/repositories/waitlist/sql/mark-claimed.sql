UPDATE waitlist_signups SET claimed_by = $2, claimed_at = now(), updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
