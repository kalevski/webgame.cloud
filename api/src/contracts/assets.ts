export const ASSET_KINDS = [
    'texture',
    'normal-map',
    'physics',
    'audio',
    'shader',
    'text',
    'json',
] as const

export type AssetKind = typeof ASSET_KINDS[number]

export const UPLOAD_STATUSES = ['pending_upload', 'processing', 'ready', 'failed'] as const

export type UploadStatus = typeof UPLOAD_STATUSES[number]

export const UPLOAD_TOKEN_SECONDS = 900

export type AssetFile = {
    id: string
    projectId: string
    parentAssetId: string | null
    kind: AssetKind

    categoryId: string | null
    name: string
    extension: string
    mime: string

    sizeBytes: number
    tags: string[]

    uploadStatus: UploadStatus
    uploadUuid: string

    createdAt: string
    updatedAt: string
}

export type UploadRequest = {
    name: string
    sizeBytes: number
    mime: string
    batchBytes?: number
    parentAssetId?: string
    kind?: AssetKind
    categoryId?: string
}

export type UploadTicket = {
    token: string
    uploadUrl: string
    expiresAt: string
}

export type AssetPatch = {
    id: string
    name?: string
    categoryId?: string | null
    tags?: string[]
}

export type FinalizeUpload = {
    sizeBytes: number
    checksum: string
    storagePath: string
    status: 'ready' | 'failed'
    error?: string
}
