import type { AssetFile, AssetKind } from './assets.js'

export const BUNDLE_ENGINES = ['phaser', 'pixi', 'custom'] as const

export type BundleEngine = typeof BUNDLE_ENGINES[number]

export const PACKING_ALGORITHMS = ['basic', 'max-rects', 'shelf', 'guillotine'] as const

export type PackingAlgorithm = typeof PACKING_ALGORITHMS[number]

export type Bundle = {
    id: string
    projectId: string
    name: string
    engine: BundleEngine

    categoryId: string | null
    includedTags: string[]
    excludedTags: string[]

    buildTag: string
    algorithm: PackingAlgorithm
    downscale: number
    rotationEnabled: boolean

    assetCount: number
    buildCount: number

    createdAt: string
    updatedAt: string
}

export type BundleDraft = {
    name: string
    engine?: BundleEngine
    categoryId?: string | null
    includedTags?: string[]
    excludedTags?: string[]
    buildTag?: string
    algorithm?: PackingAlgorithm
    downscale?: number
    rotationEnabled?: boolean
}

export type BundleRule = {
    categoryId?: string | null
    includedTags?: string[]
    excludedTags?: string[]
}

export type BundlePreview = {
    count: number
    totalBytes: number
    files: AssetFile[]
}

export type BundleRelation = {
    parentUploadId: string
    childUploadId: string
    kind: AssetKind
}

export type BundleResolution = {
    uploadIds: string[]
    relations: BundleRelation[]
}

export type BundleOptions = {
    engine: BundleEngine
    algorithm: PackingAlgorithm
    downscale: number
    rotationEnabled: boolean
}
