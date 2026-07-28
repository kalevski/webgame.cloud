SELECT * FROM waitlist_signups WHERE lower(email) = lower($1) AND deleted_at IS NULL
