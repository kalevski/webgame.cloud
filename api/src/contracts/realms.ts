export const REALM_STATUSES = ['active', 'draining', 'offline'] as const

export type RealmStatus = typeof REALM_STATUSES[number]

export const REALM_HEALTH = ['unknown', 'healthy', 'degraded', 'unhealthy'] as const

export type RealmHealth = typeof REALM_HEALTH[number]

export const MIGRATION_STATES = [
    'exporting',
    'importing',
    'repointing',
    'purging',
    'completed',
    'failed',
] as const

export type MigrationState = typeof MIGRATION_STATES[number]

export const REALM_HEARTBEAT_SECONDS = 30

export const REALM_SILENT_SECONDS = 90

export const MIGRATION_TIMEOUT_MINUTES = 30

export type RealmRegion = {
    id: string
    name: string
    active: boolean

    realmCount: number

    createdAt: string
}

export type RealmRegionDraft = {
    name: string
    active?: boolean
}

export type Realm = {
    id: string
    name: string
    baseUrl: string

    regionId: string | null
    regionName: string

    planId: string | null
    exclusive: boolean

    status: RealmStatus
    health: RealmHealth

    diskFreeBytes: number
    queueDepth: number
    cpuUsage: number
    memoryUsedBytes: number
    memoryTotalBytes: number

    storageUsedBytes: number
    peakCpuUsage: number
    peakMemoryUsedBytes: number

    projectCount: number

    lastSeenAt: string | null
    createdAt: string
}

export type RealmDraft = {
    name: string
    baseUrl: string
    regionId?: string | null
    planId?: string | null
    exclusive?: boolean
    status?: RealmStatus
}

export type RealmToken = {
    realm: Realm
    token: string
}

export type ProjectMigration = {
    id: string
    projectId: string
    fromRealmId: string | null
    toRealmId: string
    state: MigrationState
    error: string
    startedAt: string
    finishedAt: string | null
}

export type ProjectLock = {
    locked: boolean
    migration: ProjectMigration | null
}

export type RealmHeartbeat = {
    health: RealmHealth
    diskFreeBytes: number
    queueDepth: number
    cpuUsage: number
    memoryUsedBytes: number
    memoryTotalBytes: number
}

export const REALM_SAMPLE_WINDOW_HOURS = 24

export const REALM_SAMPLE_RETENTION_DAYS = 7

export const REALM_SAMPLE_BUCKET_MINUTES = 5

export type RealmSamplePoint = {
    t: string
    queueDepth: number
    cpuUsage: number
    memoryUsedBytes: number
    diskFreeBytes: number
}

export type RealmStats = {
    storageUsedBytes: number
    diskFreeBytes: number

    filesProcessedToday: number
    buildsToday: number
    avgDailyBuilds: number

    queueDepth: number
    peakQueueDepth: number

    cpuUsage: number
    avgCpuUsage: number
    peakCpuUsage: number

    memoryUsedBytes: number
    memoryTotalBytes: number
    avgMemoryUsedBytes: number
    peakMemoryUsedBytes: number
}
