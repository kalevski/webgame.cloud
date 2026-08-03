INSERT INTO project_translations (id, project_id, doc)
VALUES ($1, $2, $3::jsonb)
ON CONFLICT (project_id) WHERE deleted_at IS NULL
DO UPDATE SET doc = EXCLUDED.doc, updated_at = now()
RETURNING id
