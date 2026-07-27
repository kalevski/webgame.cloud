SELECT e.*, i.number AS invoice_number
FROM sales_enquiry_events e
LEFT JOIN invoices i ON i.id = e.invoice_id AND i.deleted_at IS NULL
WHERE e.enquiry_id = $1 AND e.deleted_at IS NULL
ORDER BY e.created_at DESC
