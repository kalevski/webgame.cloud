WITH deleted_sessions AS (
    UPDATE sessions SET deleted_at = now(), updated_at = now()
    WHERE user_id = $1 AND deleted_at IS NULL RETURNING id
), deleted_identities AS (
    UPDATE user_identities SET deleted_at = now(), updated_at = now()
    WHERE user_id = $1 AND deleted_at IS NULL RETURNING subject
), deleted_permissions AS (
    UPDATE user_permissions SET deleted_at = now(), updated_at = now()
    WHERE user_id = $1 AND deleted_at IS NULL RETURNING permission
), deleted_limits AS (
    UPDATE user_limit_overrides SET deleted_at = now(), updated_at = now()
    WHERE user_id = $1 AND deleted_at IS NULL RETURNING resource
), deleted_push AS (
    UPDATE push_subscriptions SET deleted_at = now(), updated_at = now()
    WHERE user_id = $1 AND deleted_at IS NULL RETURNING endpoint
), deleted_notifications AS (
    UPDATE notifications SET deleted_at = now(), updated_at = now()
    WHERE user_id = $1 AND deleted_at IS NULL RETURNING id
), deleted_reports AS (
    UPDATE reports SET deleted_at = now(), updated_at = now()
    WHERE reporter_id = $1 AND deleted_at IS NULL RETURNING id
), deleted_tasks AS (
    UPDATE tasks SET deleted_at = now(), updated_at = now()
    WHERE owner_id = $1 AND deleted_at IS NULL RETURNING id
), deleted_projects AS (
    UPDATE projects SET deleted_at = now(), updated_at = now()
    WHERE owner_id = $1 AND deleted_at IS NULL RETURNING id
), deleted_subscription AS (
    UPDATE subscriptions SET deleted_at = now(), updated_at = now()
    WHERE user_id = $1 AND deleted_at IS NULL RETURNING user_id
), deleted_invoices AS (
    UPDATE invoices SET deleted_at = now(), updated_at = now()
    WHERE user_id = $1 AND deleted_at IS NULL RETURNING id
), deleted_enquiries AS (
    UPDATE sales_enquiries SET deleted_at = now(), updated_at = now()
    WHERE user_id = $1 AND deleted_at IS NULL RETURNING id
), deleted_user AS (
    UPDATE users SET deleted_at = now(), updated_at = now()
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING id
)
SELECT count(*)::int AS c FROM deleted_user
