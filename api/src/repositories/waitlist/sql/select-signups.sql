SELECT * FROM waitlist_signups
WHERE deleted_at IS NULL
  AND ($3::timestamptz IS NULL OR (created_at, id) < ($3, $4))
ORDER BY created_at DESC, id DESC
LIMIT $1 OFFSET $2
