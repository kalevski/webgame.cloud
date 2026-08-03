INSERT INTO video_template_frames (id, video_template_id, frame_template_id, position, duration_ms, transition, field_values)
VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
