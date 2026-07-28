SELECT count(*) AS total, count(claimed_at) AS claimed FROM waitlist_signups WHERE deleted_at IS NULL
