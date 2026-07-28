INSERT INTO waitlist_signups (id, email, marketing_opt_in, consent_version, source)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (lower(email)) WHERE deleted_at IS NULL DO UPDATE SET
    marketing_opt_in = EXCLUDED.marketing_opt_in,
    consent_version = EXCLUDED.consent_version,
    deleted_at = NULL,
    updated_at = now()
RETURNING id
