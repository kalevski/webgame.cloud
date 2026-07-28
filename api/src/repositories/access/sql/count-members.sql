SELECT (
    (SELECT count(*) FROM project_members WHERE project_id = $1 AND deleted_at IS NULL)
    + (SELECT count(*) FROM project_invites WHERE project_id = $1 AND accepted_at IS NULL AND deleted_at IS NULL)
) AS c
