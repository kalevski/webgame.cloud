import type { Bundle, BundleEngine, PackingAlgorithm } from '../contracts/index.js'

export type BundleRow = {
    id: string
    project_id: string
    name: string
    engine: BundleEngine
    category_id: string | null
    included_tags: string[]
    excluded_tags: string[]
    build_tag: string
    algorithm: PackingAlgorithm
    downscale: number
    rotation_enabled: boolean
    asset_count?: string
    build_count?: string
    created_at: Date
    updated_at: Date
}

export const toBundle = (row: BundleRow): Bundle => ({
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    engine: row.engine,
    categoryId: row.category_id,
    includedTags: row.included_tags ?? [],
    excludedTags: row.excluded_tags ?? [],
    buildTag: row.build_tag,
    algorithm: row.algorithm,
    downscale: row.downscale,
    rotationEnabled: row.rotation_enabled,
    assetCount: Number(row.asset_count ?? 0),
    buildCount: Number(row.build_count ?? 0),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
})
