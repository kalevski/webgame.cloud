SELECT i.*, p.name AS project_name, u.name AS inviter_name
FROM project_invites i
JOIN projects p ON p.id = i.project_id AND p.deleted_at IS NULL
LEFT JOIN users u ON u.id = i.invited_by AND u.deleted_at IS NULL
WHERE (i.user_id = $1 OR lower(i.email) = lower($2))
  AND i.accepted_at IS NULL AND i.deleted_at IS NULL AND i.expires_at > now()
ORDER BY i.created_at DESC
