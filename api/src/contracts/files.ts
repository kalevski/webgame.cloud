export const ASSET_SOURCE_TYPES = [
    'disk',
    's3',
] as const

export type AssetSourceType = typeof ASSET_SOURCE_TYPES[number]

export const ASSET_SOURCE_TYPE_LABELS: Record<AssetSourceType, string> = {
    disk: 'Local disk',
    s3: 'S3-compatible bucket',
}

export type AssetSourceConfig = {
    basePath?: string

    bucket?: string
    region?: string
    endpoint?: string
    forcePathStyle?: boolean
    accessKeyId?: string
}

export type AssetSourceRules = {
    extensions: string[]
    mimeTypes: string[]
}

export const EMPTY_ASSET_SOURCE_RULES: AssetSourceRules = { extensions: [], mimeTypes: [] }

export type AssetSource = {
    id: string

    name: string
    type: AssetSourceType

    config: AssetSourceConfig
    secretSet: boolean

    rules: AssetSourceRules

    createdAt: string
    updatedAt: string
}

export type AssetSourceDraft = {
    name: string
    type: AssetSourceType

    config?: AssetSourceConfig
    secret?: string

    rules?: Partial<AssetSourceRules>
}

export const normalizeExtension = (raw: string): string =>
    raw.trim().toLowerCase().replace(/^[.*]+/, '').replace(/[^a-z0-9]/g, '').slice(0, 20)

export const normalizeMimeType = (raw: string): string =>
    raw.trim().toLowerCase().replace(/[^a-z0-9!#$&^_.+/*-]/g, '').slice(0, 100)

export const extensionOf = (fileName: string): string => {
    const dot = fileName.lastIndexOf('.')
    return dot === -1 ? '' : normalizeExtension(fileName.slice(dot + 1))
}

export const mimeMatches = (pattern: string, mime: string): boolean => {
    const value = mime.toLowerCase().split(';')[0].trim()
    if (pattern === '*' || pattern === '*/*') return true
    if (pattern.endsWith('/*')) return value.startsWith(`${pattern.slice(0, -1)}`)
    return pattern === value
}

export const extensionAllowed = (rules: AssetSourceRules, fileName: string): boolean =>
    rules.extensions.length === 0 || rules.extensions.includes(extensionOf(fileName))

export const mimeTypeAllowed = (rules: AssetSourceRules, mime: string): boolean =>
    rules.mimeTypes.length === 0 || rules.mimeTypes.some((pattern) => mimeMatches(pattern, mime))

export const ASSET_TYPES = [

    'profile_picture',
] as const

export type AssetType = typeof ASSET_TYPES[number]

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
    profile_picture: 'Profile pictures',
}

export type AssetTypeBindings = Record<AssetType, string | null>

export type StoredFile = {
    id: string

    assetType: AssetType
    sourceId: string
    location: string

    ownerId: string | null

    originalName: string
    mime: string
    size: number

    createdAt: string
}
