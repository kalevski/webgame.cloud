WITH keys AS (
    UPDATE api_keys SET revoked_at = now(), deleted_at = now(), updated_at = now()
    WHERE owner_id = $1 AND deleted_at IS NULL
),
permissions AS (
    UPDATE user_permissions SET deleted_at = now(), updated_at = now()
    WHERE user_id = $1 AND deleted_at IS NULL
),
limits AS (
    UPDATE user_limit_overrides SET deleted_at = now(), updated_at = now()
    WHERE user_id = $1 AND deleted_at IS NULL
),
account AS (
    UPDATE users SET active = false, deleted_at = now(), updated_at = now()
    WHERE id = $1 AND kind = 'service' AND deleted_at IS NULL
    RETURNING id
)
SELECT count(*)::int AS c FROM account
