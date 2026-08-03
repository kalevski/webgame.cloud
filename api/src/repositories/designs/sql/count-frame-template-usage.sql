SELECT count(*)::int AS c
FROM video_template_frames f
JOIN video_templates v ON v.id = f.video_template_id AND v.deleted_at IS NULL
WHERE f.frame_template_id = $1 AND f.deleted_at IS NULL
