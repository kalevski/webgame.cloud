import type {
    MigrationState,
    ProjectMigration,
    Realm,
    RealmHealth,
    RealmStatus,
} from '../contracts/index.js'
import { REALM_SILENT_SECONDS } from '../contracts/index.js'

export type RealmRow = {
    id: string
    name: string
    base_url: string
    region: string
    plan_id: string | null
    exclusive: boolean
    status: RealmStatus
    token_hash: string
    disk_free_bytes: string | number
    queue_depth: number
    health: RealmHealth
    last_seen_at: Date | null
    project_count?: string
    created_at: Date
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
    region: row.region,
    planId: row.plan_id,
    exclusive: row.exclusive,
    status: row.status,
    health: isSilent(row) ? 'unknown' : row.health,
    diskFreeBytes: Number(row.disk_free_bytes ?? 0),
    queueDepth: row.queue_depth,
    projectCount: Number(row.project_count ?? 0),
    lastSeenAt: row.last_seen_at?.toISOString() ?? null,
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
