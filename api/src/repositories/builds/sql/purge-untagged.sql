WITH doomed AS (
    SELECT id FROM builds
    WHERE project_id = $1 AND build_tag = '' AND deleted_at IS NULL
), gone_files AS (
    UPDATE build_files SET deleted_at = now(), updated_at = now()
    WHERE build_id IN (SELECT id FROM doomed) AND deleted_at IS NULL
    RETURNING id
), gone_builds AS (
    UPDATE builds SET deleted_at = now(), updated_at = now()
    WHERE id IN (SELECT id FROM doomed)
    RETURNING id, artifact_url
)
SELECT (SELECT count(*) FROM gone_builds)::int AS c
