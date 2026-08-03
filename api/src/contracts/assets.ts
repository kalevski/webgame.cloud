export const ASSET_KINDS = [
    'texture',
    'audio',
    'video',
    'data',
    'plain',
    'font',
    'normal-map',
    'physics',
    'bitmap-font',
    'bitmap-font-page',
] as const

export type AssetKind = typeof ASSET_KINDS[number]

export const UPLOADABLE_KINDS: readonly AssetKind[] = ['texture', 'audio', 'video', 'data', 'plain', 'font']

export const TOOL_ONLY_KINDS: readonly AssetKind[] = ['normal-map', 'physics', 'bitmap-font', 'bitmap-font-page']

export const PARENTED_KINDS: readonly AssetKind[] = ['normal-map', 'bitmap-font-page']

export const KIND_CHILDREN: Partial<Record<AssetKind, readonly AssetKind[]>> = {
    'texture': ['normal-map', 'physics'],
    'font': ['bitmap-font'],
    'bitmap-font': ['bitmap-font-page'],
}

export const UPLOAD_STATUSES = ['pending_upload', 'processing', 'ready', 'failed'] as const

export type UploadStatus = typeof UPLOAD_STATUSES[number]

export type UploadFormat = {
    extension: string
    mime: string
}

export const UPLOAD_FORMATS: UploadFormat[] = [
    { extension: 'png', mime: 'image/png' },
    { extension: 'jpg', mime: 'image/jpeg' },
    { extension: 'webp', mime: 'image/webp' },
    { extension: 'ktx2', mime: 'image/ktx2' },
    { extension: 'mp4', mime: 'video/mp4' },
    { extension: 'webm', mime: 'video/webm' },
    { extension: 'ogg', mime: 'audio/ogg' },
    { extension: 'opus', mime: 'audio/opus' },
    { extension: 'mp3', mime: 'audio/mpeg' },
    { extension: 'wav', mime: 'audio/wav' },
    { extension: 'm4a', mime: 'audio/mp4' },
    { extension: 'json', mime: 'application/json' },
    { extension: 'xml', mime: 'application/xml' },
    { extension: 'csv', mime: 'text/csv' },
    { extension: 'txt', mime: 'text/plain' },
    { extension: 'md', mime: 'text/markdown' },
    { extension: 'html', mime: 'text/html' },
    { extension: 'css', mime: 'text/css' },
    { extension: 'js', mime: 'text/javascript' },
    { extension: 'ttf', mime: 'font/ttf' },
    { extension: 'otf', mime: 'font/otf' },
    { extension: 'fnt', mime: 'application/x-font-bmfont' },
]

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
    categoryId?: string
    tags?: string[]
    kind?: AssetKind
    parentAssetId?: string
}

export type AssetSourceTicket = {
    url: string
    mime: string
    kind: AssetKind
    expiresAt: string
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
    parentAssetId?: string | null
}

export type FinalizeUpload = {
    sizeBytes: number
    checksum: string
    storagePath: string
    status: 'ready' | 'failed'
    error?: string
}
