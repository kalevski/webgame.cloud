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

export type AssetSource = {
    id: string

    name: string
    type: AssetSourceType

    config: AssetSourceConfig
    secretSet: boolean

    createdAt: string
    updatedAt: string
}

export type AssetSourceDraft = {
    name: string
    type: AssetSourceType

    config?: AssetSourceConfig
    secret?: string
}

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
