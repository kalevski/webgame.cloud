import type { Build, BuildFile, BuildFileGroup, BuildSnapshot, BuildStatus } from '../contracts/index.js'

export type BuildRowStatus = 'pending' | 'running' | 'done' | 'failed'

export type BuildRow = {
    id: string
    project_id: string
    bundle_id: string
    realm_id: string | null
    triggered_by: string | null
    status: BuildRowStatus
    build_tag: string
    snapshot: BuildSnapshot | Record<string, never>
    artifact_url: string
    manifest_url: string
    checksum: string
    size_bytes: string | number
    duration_ms: number
    error: string
    claimed_at: Date | null
    finished_at: Date | null
    bundle_name?: string
    triggered_by_name?: string | null
    created_at: Date
    updated_at: Date
}

export type BuildFileRow = {
    id: string
    build_id: string
    group_name: BuildFileGroup
    name: string
    url: string
    size_bytes: string | number
    checksum: string
}

const WIRE_STATUS: Record<BuildRowStatus, BuildStatus> = {
    pending: 'queued',
    running: 'running',
    done: 'pass',
    failed: 'fail',
}

export const toWireStatus = (status: BuildRowStatus): BuildStatus => WIRE_STATUS[status]

export const toRowStatus = (status: BuildStatus): BuildRowStatus =>
    (Object.keys(WIRE_STATUS) as BuildRowStatus[]).find((key) => WIRE_STATUS[key] === status) ?? 'pending'

export const toBuild = (row: BuildRow): Build => ({
    id: row.id,
    projectId: row.project_id,
    bundleId: row.bundle_id,
    bundleName: row.bundle_name ?? '',
    status: toWireStatus(row.status),
    buildTag: row.build_tag,
    artifactUrl: row.artifact_url,
    manifestUrl: row.manifest_url,
    checksum: row.checksum,
    sizeBytes: Number(row.size_bytes ?? 0),
    durationMs: row.duration_ms,
    error: row.error,
    triggeredBy: row.triggered_by_name ?? '',
    createdAt: row.created_at.toISOString(),
    finishedAt: row.finished_at?.toISOString() ?? null,
})

export const toBuildFile = (row: BuildFileRow): BuildFile => ({
    id: row.id,
    group: row.group_name,
    name: row.name,
    url: row.url,
    sizeBytes: Number(row.size_bytes ?? 0),
    checksum: row.checksum,
})
