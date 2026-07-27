SELECT c.relname AS table_name
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_attribute a ON a.attrelid = c.oid
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND a.attname = 'deleted_at'
  AND a.attnum > 0
  AND NOT a.attisdropped
ORDER BY c.relname
