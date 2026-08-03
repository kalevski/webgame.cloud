SELECT v.*, coalesce((
    SELECT json_agg(json_build_object(
        'id', f.id,
        'frameTemplateId', f.frame_template_id,
        'frameName', t.name,
        'position', f.position,
        'durationMs', f.duration_ms,
        'transition', f.transition,
        'values', f.field_values
    ) ORDER BY f.position, f.id)
    FROM video_template_frames f
    JOIN frame_templates t ON t.id = f.frame_template_id AND t.deleted_at IS NULL
    WHERE f.video_template_id = v.id AND f.deleted_at IS NULL
), '[]'::json) AS frames
FROM video_templates v
WHERE v.owner_id = $1 AND v.deleted_at IS NULL
ORDER BY v.updated_at DESC, v.id
