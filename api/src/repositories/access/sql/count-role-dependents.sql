SELECT
    (SELECT count(*) FROM billing_plans WHERE role_id = $1 AND deleted_at IS NULL) AS plans,
    (SELECT count(*) FROM billing_plans
      WHERE visible_role_ids ? $1 AND deleted_at IS NULL) AS visibility,
    (SELECT count(*) FROM role_applications
      WHERE role_id = $1 AND status = 'pending' AND deleted_at IS NULL) AS applications
