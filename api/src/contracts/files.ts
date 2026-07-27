export const FILE_SOURCE_TYPES = [
    'disk',
    's3',
] as const

export type FileSourceType = typeof FILE_SOURCE_TYPES[number]

export const FILE_SOURCE_TYPE_LABELS: Record<FileSourceType, string> = {
    disk: 'Local disk',
    s3: 'S3-compatible bucket',
}

export type FileSourceConfig = {
    basePath?: string

    bucket?: string
    region?: string
    endpoint?: string
    forcePathStyle?: boolean
    accessKeyId?: string
}

export type FileSource = {
    id: string

    name: string
    type: FileSourceType

    config: FileSourceConfig
    secretSet: boolean

    createdAt: string
    updatedAt: string
}

export type FileSourceDraft = {
    name: string
    type: FileSourceType

    config?: FileSourceConfig
    secret?: string
}

export const FILE_TYPES = [

    'profile_picture',
] as const

export type FileType = typeof FILE_TYPES[number]

export const FILE_TYPE_LABELS: Record<FileType, string> = {
    profile_picture: 'Profile pictures',
}

export type FileTypeBindings = Record<FileType, string | null>

export type StoredFile = {
    id: string

    fileType: FileType
    sourceId: string
    location: string

    ownerId: string | null

    originalName: string
    mime: string
    size: number

    createdAt: string
}
