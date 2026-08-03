SELECT date_bin($3::int * interval '1 minute', created_at, timestamptz 'epoch') AS bucket,
    round(avg(queue_depth))::int          AS queue_depth,
    round(avg(cpu_usage))::int            AS cpu_usage,
    round(avg(memory_used_bytes))::bigint AS memory_used_bytes,
    round(avg(disk_free_bytes))::bigint   AS disk_free_bytes
FROM realm_samples
WHERE realm_id = $1 AND created_at >= now() - ($2::int * interval '1 hour') AND deleted_at IS NULL
GROUP BY bucket
ORDER BY bucket
