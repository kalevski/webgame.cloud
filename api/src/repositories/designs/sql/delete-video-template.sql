WITH deleted_frames AS (
    UPDATE video_template_frames SET deleted_at = now(), updated_at = now()
    WHERE video_template_id = $1 AND deleted_at IS NULL RETURNING id
)
UPDATE video_templates SET deleted_at = now(), updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
