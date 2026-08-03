SELECT
    max(queue_depth)             AS peak_queue_depth,
    avg(cpu_usage)               AS avg_cpu_usage,
    max(cpu_usage)               AS peak_cpu_usage,
    avg(memory_used_bytes)       AS avg_memory_used_bytes,
    max(memory_used_bytes)       AS peak_memory_used_bytes
FROM realm_samples
WHERE realm_id = $1 AND created_at >= now() - ($2::int * interval '1 hour') AND deleted_at IS NULL
