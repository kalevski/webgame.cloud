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

export type Realm = {
    id: string
    name: string
    baseUrl: string
    region: string

    planId: string | null
    exclusive: boolean

    status: RealmStatus
    health: RealmHealth

    diskFreeBytes: number
    queueDepth: number

    projectCount: number

    lastSeenAt: string | null
    createdAt: string
}

export type RealmDraft = {
    name: string
    baseUrl: string
    region?: string
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
}
