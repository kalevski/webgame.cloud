INSERT INTO audit_log (id, actor_id, actor_name, action, target_id, detail, request_id, impersonated)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
