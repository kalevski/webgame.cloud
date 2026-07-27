SELECT count(*) AS c FROM email_messages
WHERE deleted_at IS NULL
  AND ($1::text IS NULL OR status = $1)
  AND ($2::text IS NULL OR template_key = $2)
  AND ($3::timestamptz IS NULL OR created_at >= $3)
  AND ($4::timestamptz IS NULL OR created_at <= $4)
  AND ($5::text IS NULL OR to_email ILIKE '%' || $5 || '%' OR subject ILIKE '%' || $5 || '%' OR body ILIKE '%' || $5 || '%')
