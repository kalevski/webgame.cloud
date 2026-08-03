SELECT (
    (SELECT count(*) FROM frame_templates WHERE owner_id = $1 AND deleted_at IS NULL)
  + (SELECT count(*) FROM video_templates WHERE owner_id = $1 AND deleted_at IS NULL)
) AS c
