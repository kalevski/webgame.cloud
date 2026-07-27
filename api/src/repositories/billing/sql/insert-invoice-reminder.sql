INSERT INTO invoice_reminders (id, invoice_id, stage)
VALUES ($1, $2, $3)
ON CONFLICT (invoice_id, stage) WHERE deleted_at IS NULL DO NOTHING
