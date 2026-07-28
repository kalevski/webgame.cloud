INSERT INTO builds (id, project_id, bundle_id, realm_id, triggered_by, build_tag, snapshot)
VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
RETURNING id
