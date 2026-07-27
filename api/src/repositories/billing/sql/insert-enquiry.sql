INSERT INTO sales_enquiries (id, plan_id, user_id, status, answers)
VALUES ($1, $2, $3, $4, $5::jsonb)
