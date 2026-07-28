import type { AssetSource, AssetSourceConfig, AssetSourceType, AssetType, StoredFile } from '../contracts/index.js'

export type AssetSourceRow = {
    id: string
    name: string
    type: AssetSourceType
    config: AssetSourceConfig
    secret: string
    created_at: Date
    updated_at: Date
}

export type FileRow = {
    id: string
    asset_type: AssetType
    source_id: string
    location: string
    owner_id: string | null
    original_name: string
    mime: string
    size: string
    created_at: Date
    updated_at: Date
}

export const toAssetSource = (row: AssetSourceRow): AssetSource => ({
    id: row.id,
    name: row.name,
    type: row.type,
    config: row.config ?? {},
    secretSet: row.secret !== '',
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
})

export const toStoredFile = (row: FileRow): StoredFile => ({
    id: row.id,
    assetType: row.asset_type,
    sourceId: row.source_id,
    location: row.location,
    ownerId: row.owner_id,
    originalName: row.original_name,
    mime: row.mime,
    size: Number(row.size),
    createdAt: row.created_at.toISOString(),
})
