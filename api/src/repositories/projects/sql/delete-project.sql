WITH gone_members AS (
    UPDATE project_members SET deleted_at = now(), updated_at = now()
    WHERE project_id = $1 AND deleted_at IS NULL RETURNING id
), gone_invites AS (
    UPDATE project_invites SET deleted_at = now(), updated_at = now()
    WHERE project_id = $1 AND deleted_at IS NULL RETURNING id
), gone_categories AS (
    UPDATE asset_categories SET deleted_at = now(), updated_at = now()
    WHERE project_id = $1 AND deleted_at IS NULL RETURNING id
), gone_tags AS (
    UPDATE project_tags SET deleted_at = now(), updated_at = now()
    WHERE project_id = $1 AND deleted_at IS NULL RETURNING id
), gone_build_tags AS (
    UPDATE project_build_tags SET deleted_at = now(), updated_at = now()
    WHERE project_id = $1 AND deleted_at IS NULL RETURNING id
), gone_assets AS (
    UPDATE assets SET deleted_at = now(), updated_at = now()
    WHERE project_id = $1 AND deleted_at IS NULL RETURNING id
), gone_build_files AS (
    UPDATE build_files SET deleted_at = now(), updated_at = now()
    WHERE build_id IN (SELECT id FROM builds WHERE project_id = $1 AND deleted_at IS NULL)
      AND deleted_at IS NULL RETURNING id
), gone_builds AS (
    UPDATE builds SET deleted_at = now(), updated_at = now()
    WHERE project_id = $1 AND deleted_at IS NULL RETURNING id
), gone_bundles AS (
    UPDATE bundles SET deleted_at = now(), updated_at = now()
    WHERE project_id = $1 AND deleted_at IS NULL RETURNING id
), gone_versions AS (
    UPDATE config_versions SET deleted_at = now(), updated_at = now()
    WHERE config_id IN (SELECT id FROM configs WHERE project_id = $1 AND deleted_at IS NULL)
      AND deleted_at IS NULL RETURNING id
), gone_configs AS (
    UPDATE configs SET deleted_at = now(), updated_at = now()
    WHERE project_id = $1 AND deleted_at IS NULL RETURNING id
), gone_schemas AS (
    UPDATE config_schemas SET deleted_at = now(), updated_at = now()
    WHERE project_id = $1 AND deleted_at IS NULL RETURNING id
), gone_project AS (
    UPDATE projects SET deleted_at = now(), updated_at = now()
    WHERE id = $1 AND deleted_at IS NULL RETURNING id
)
SELECT (SELECT count(*) FROM gone_project)::int AS c
