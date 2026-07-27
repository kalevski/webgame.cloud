SELECT status, count(*) AS c FROM jobs WHERE deleted_at IS NULL GROUP BY status
