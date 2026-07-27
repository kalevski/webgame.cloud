UPDATE sales_enquiries SET status = $2, updated_at = now() WHERE id = $1 AND deleted_at IS NULL
