import type { Bundle, BundleOptions, BundleRelation } from './bundles.js'

export const BUILD_STATUSES = ['queued', 'running', 'pass', 'fail'] as const

export type BuildStatus = typeof BUILD_STATUSES[number]

export const BUILD_FILE_GROUPS = [
    'textures',
    'audio',
    'text',
    'configs',
    'fonts',
    'locales',
    'dialogues',
] as const

export type BuildFileGroup = typeof BUILD_FILE_GROUPS[number]

export const BUILD_POLL_MAX_MS = 30_000

export type BuildFile = {
    id: string
    group: BuildFileGroup
    name: string
    url: string
    sizeBytes: number
    checksum: string
}

export type BuildFileDraft = {
    group: BuildFileGroup
    name: string
    url?: string
    sizeBytes?: number
    checksum?: string
}

export type BuildSnapshot = {
    bundle: Bundle
    configs: Array<{ key: string; versionId: string; buildTag: string }>
}

export type Build = {
    id: string
    projectId: string
    bundleId: string
    bundleName: string

    status: BuildStatus
    buildTag: string

    artifactUrl: string
    manifestUrl: string
    checksum: string

    sizeBytes: number
    durationMs: number
    error: string

    triggeredBy: string
    createdAt: string
    finishedAt: string | null
}

export type BuildDetail = Build & {
    files: BuildFile[]
    snapshot: BuildSnapshot | null
}

export type BuildFilters = {
    status?: BuildStatus
    bundleId?: string
    limit?: number
    offset?: number
    cursor?: string
}

export type RealmJob = {
    jobId: string
    kind: 'asset_bundle:generate'
    payload: {
        projectId: string
        bundleId: string
        uploadIds: string[]
        relations: BundleRelation[]
        options: BundleOptions
    }
}

export type RealmJobStatus = {
    status: 'started' | 'in_progress'
    progress?: number
    message?: string
}

export type RealmJobResult = {
    state: 'fulfilled' | 'rejected'
    artifactUrl?: string
    manifestUrl?: string
    checksum?: string
    sizeBytes?: number
    durationMs?: number
    files?: BuildFileDraft[]
    error?: string
}

export type AssetManifest = {
    buildId: string
    buildTag: string
    checksum: string
    files: Array<{ group: BuildFileGroup; name: string; url: string; sizeBytes: number; checksum: string }>
}
