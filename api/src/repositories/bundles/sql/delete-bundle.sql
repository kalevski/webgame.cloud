WITH gone_build_files AS (
    UPDATE build_files SET deleted_at = now(), updated_at = now()
    WHERE build_id IN (SELECT id FROM builds WHERE bundle_id = $1 AND deleted_at IS NULL)
      AND deleted_at IS NULL
    RETURNING id
), gone_builds AS (
    UPDATE builds SET deleted_at = now(), updated_at = now()
    WHERE bundle_id = $1 AND deleted_at IS NULL
    RETURNING id
), gone_bundle AS (
    UPDATE bundles SET deleted_at = now(), updated_at = now()
    WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL
    RETURNING id
)
SELECT (SELECT count(*) FROM gone_bundle)::int AS c
