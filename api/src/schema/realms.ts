import type {
    MigrationState,
    ProjectMigration,
    Realm,
    RealmHealth,
    RealmRegion,
    RealmStatus,
} from '../contracts/index.js'
import { REALM_SILENT_SECONDS } from '../contracts/index.js'

export type RealmRow = {
    id: string
    name: string
    base_url: string
    region_id: string | null
    plan_id: string | null
    exclusive: boolean
    status: RealmStatus
    token_hash: string
    disk_free_bytes: string | number
    queue_depth: number
    cpu_usage: number
    memory_used_bytes: string | number
    memory_total_bytes: string | number
    health: RealmHealth
    last_seen_at: Date | null
    region_name?: string | null
    project_count?: string
    storage_used_bytes?: string | number
    peak_cpu_usage?: number | null
    peak_memory_used_bytes?: string | number | null
    created_at: Date
}

export type RealmRegionRow = {
    id: string
    name: string
    active: boolean
    realm_count?: string
    created_at: Date
}

export type RealmUsageRow = {
    storage_used_bytes: string
    files_processed_today: string
    builds_today: string
    builds_week: string
}

export type RealmSampleBucketRow = {
    bucket: Date
    queue_depth: number
    cpu_usage: number
    memory_used_bytes: string | number
    disk_free_bytes: string | number
}

export type RealmSampleStatsRow = {
    peak_queue_depth: number | null
    avg_cpu_usage: string | null
    peak_cpu_usage: number | null
    avg_memory_used_bytes: string | null
    peak_memory_used_bytes: string | number | null
}

export type ProjectMigrationRow = {
    id: string
    project_id: string
    from_realm_id: string | null
    to_realm_id: string
    state: MigrationState
    actor_id: string | null
    error: string
    started_at: Date
    finished_at: Date | null
}

export const isSilent = (row: RealmRow, now = Date.now()): boolean =>
    !row.last_seen_at || now - row.last_seen_at.getTime() > REALM_SILENT_SECONDS * 1000

export const toRealm = (row: RealmRow): Realm => ({
    id: row.id,
    name: row.name,
    baseUrl: row.base_url,
    regionId: row.region_id,
    regionName: row.region_name ?? '',
    planId: row.plan_id,
    exclusive: row.exclusive,
    status: row.status,
    health: isSilent(row) ? 'unknown' : row.health,
    diskFreeBytes: Number(row.disk_free_bytes ?? 0),
    queueDepth: row.queue_depth,
    cpuUsage: row.cpu_usage,
    memoryUsedBytes: Number(row.memory_used_bytes ?? 0),
    memoryTotalBytes: Number(row.memory_total_bytes ?? 0),
    storageUsedBytes: Number(row.storage_used_bytes ?? 0),
    peakCpuUsage: Number(row.peak_cpu_usage ?? 0),
    peakMemoryUsedBytes: Number(row.peak_memory_used_bytes ?? 0),
    projectCount: Number(row.project_count ?? 0),
    lastSeenAt: row.last_seen_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
})

export const toRealmRegion = (row: RealmRegionRow): RealmRegion => ({
    id: row.id,
    name: row.name,
    active: row.active,
    realmCount: Number(row.realm_count ?? 0),
    createdAt: row.created_at.toISOString(),
})

export const toMigration = (row: ProjectMigrationRow): ProjectMigration => ({
    id: row.id,
    projectId: row.project_id,
    fromRealmId: row.from_realm_id,
    toRealmId: row.to_realm_id,
    state: row.state,
    error: row.error,
    startedAt: row.started_at.toISOString(),
    finishedAt: row.finished_at?.toISOString() ?? null,
})
