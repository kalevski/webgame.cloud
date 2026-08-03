SELECT r.*,
       coalesce(f.name, v.name, '') AS template_name
FROM designs r
LEFT JOIN frame_templates f ON f.id = r.frame_template_id AND f.deleted_at IS NULL
LEFT JOIN video_templates v ON v.id = r.video_template_id AND v.deleted_at IS NULL
WHERE r.id = $1 AND r.deleted_at IS NULL
