SELECT (
    (SELECT count(*) FROM assets WHERE project_id = $1 AND deleted_at IS NULL AND tags && ARRAY[$2]::text[])
    + (SELECT count(*) FROM bundles WHERE project_id = $1 AND deleted_at IS NULL
        AND (included_tags && ARRAY[$2]::text[] OR excluded_tags && ARRAY[$2]::text[]))
) AS c
