import type { AssetFile, AssetKind, UploadStatus } from '../contracts/index.js'

export type AssetRow = {
    id: string
    project_id: string
    uploaded_by: string | null
    parent_asset_id: string | null
    kind: AssetKind
    category_id: string | null
    name: string
    extension: string
    mime: string
    size_bytes: string | number
    tags: string[]
    upload_status: UploadStatus
    upload_uuid: string
    storage_path: string
    checksum: string
    finalized_at: Date | null
    created_at: Date
    updated_at: Date
}

export const toAssetFile = (row: AssetRow): AssetFile => ({
    id: row.id,
    projectId: row.project_id,
    parentAssetId: row.parent_asset_id,
    kind: row.kind,
    categoryId: row.category_id,
    name: row.name,
    extension: row.extension,
    mime: row.mime,
    sizeBytes: Number(row.size_bytes ?? 0),
    tags: row.tags ?? [],
    uploadStatus: row.upload_status,
    uploadUuid: row.upload_uuid,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
})
