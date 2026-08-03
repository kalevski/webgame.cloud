INSERT INTO designs (id, owner_id, name, kind, frame_template_id, video_template_id, entries)
VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
RETURNING id
