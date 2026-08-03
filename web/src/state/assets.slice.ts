import { StateCreator } from 'zustand'
import AssetService from 'services/AssetService'
import UploadService from 'services/UploadService'
import { STRINGS } from 'configs/strings'
import { AssetFile, AssetKind, AssetPatch } from 'types'
import type { AppStore } from './index'

export type QueuedUpload = {
    id: string
    name: string
    size: number
    loaded: number
    status: 'waiting' | 'uploading' | 'done' | 'failed'
    error?: string
}

export type UploadAssignment = {
    categoryId?: string
    tags?: string[]
}

export type ToolAssetDraft = {
    file: File
    kind: AssetKind
    parentAssetId?: string
    attachment?: {
        file: File
        kind: AssetKind
    }
}

export type AssetsSlice = {
    assets: AssetFile[]
    assetsLoaded: boolean
    queue: QueuedUpload[]
    dirty: Record<string, AssetPatch>
    rejected: string[]

    fetchAssets: (projectId: string) => Promise<void>
    enqueueUploads: (projectId: string, files: File[], assign?: UploadAssignment) => Promise<void>
    stageEdit: (patch: AssetPatch) => void
    discardEdits: () => void
    saveEdits: (projectId: string) => Promise<boolean>
    applyAssetPatches: (projectId: string, patches: AssetPatch[]) => Promise<boolean>
    deleteAsset: (projectId: string, assetId: string) => Promise<boolean>
    clearQueue: () => void
    loadAssetBlob: (projectId: string, assetId: string) => Promise<Blob | null>
    saveToolAsset: (projectId: string, draft: ToolAssetDraft) => Promise<boolean>
}

const fail = (get: () => AppStore, error: unknown, fallback: string) =>
    get().addAlert({
        variant: 'danger',
        message: error instanceof Error ? error.message : fallback,
        dismissible: true,
    })

export const createAssetsSlice: StateCreator<AppStore, [], [], AssetsSlice> = (set, get) => ({
    assets: [],
    assetsLoaded: false,
    queue: [],
    dirty: {},
    rejected: [],

    async fetchAssets(projectId) {
        try {
            set({ assets: await AssetService.getInstance().list(projectId), assetsLoaded: true })
        } catch (error) {
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async enqueueUploads(projectId, files, assign) {
        const batchBytes = files.reduce((sum, file) => sum + file.size, 0)
        set({
            queue: files.map((file) => ({
                id: `${file.name}:${file.size}`,
                name: file.name,
                size: file.size,
                loaded: 0,
                status: 'waiting' as const,
            })),
            rejected: [],
        })

        for (const file of files) {
            const id = `${file.name}:${file.size}`
            const mark = (patch: Partial<QueuedUpload>) =>
                set({ queue: get().queue.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)) })

            mark({ status: 'uploading' })
            try {
                await UploadService.getInstance().upload(projectId, file, {
                    batchBytes,
                    categoryId: assign?.categoryId,
                    tags: assign?.tags,
                    onProgress: (loaded) => mark({ loaded }),
                })
                mark({ status: 'done', loaded: file.size })
            } catch (error) {
                mark({ status: 'failed', error: error instanceof Error ? error.message : 'failed' })
                set({ rejected: [...get().rejected, file.name] })
            }
        }

        await get().fetchAssets(projectId)
        void get().fetchProjectUsage(projectId)
        set({ queue: get().queue.filter((entry) => entry.status === 'failed') })
    },

    stageEdit(patch) {
        const existing = get().dirty[patch.id] ?? { id: patch.id }
        set({ dirty: { ...get().dirty, [patch.id]: { ...existing, ...patch } } })
    },

    discardEdits() {
        set({ dirty: {} })
    },

    async saveEdits(projectId) {
        const patches = Object.values(get().dirty)
        if (patches.length === 0) return true
        try {
            set({ assets: await AssetService.getInstance().patchMany(projectId, patches), dirty: {} })
            void get().fetchProjectUsage(projectId)
            return true
        } catch (error) {
            fail(get, error, STRINGS.common.saveFailed)
            return false
        }
    },

    async applyAssetPatches(projectId, patches) {
        if (patches.length === 0) return true
        try {
            set({ assets: await AssetService.getInstance().patchMany(projectId, patches) })
            void get().fetchProjectUsage(projectId)
            return true
        } catch (error) {
            fail(get, error, STRINGS.common.saveFailed)
            return false
        }
    },

    async deleteAsset(projectId, assetId) {
        try {
            await AssetService.getInstance().remove(projectId, assetId)
            set({ assets: get().assets.filter((asset) => asset.id !== assetId) })
            void get().fetchProjectUsage(projectId)
            return true
        } catch (error) {
            fail(get, error, STRINGS.common.saveFailed)
            return false
        }
    },

    clearQueue() {
        set({ queue: [] })
    },

    async loadAssetBlob(projectId, assetId) {
        try {
            const ticket = await AssetService.getInstance().source(projectId, assetId)
            const response = await fetch(ticket.url)
            if (!response.ok) throw new Error(STRINGS.tools.sourceFailed)
            return await response.blob()
        } catch (error) {
            fail(get, error, STRINGS.common.loadFailed)
            return null
        }
    },

    async saveToolAsset(projectId, draft) {
        try {
            const assetId = await UploadService.getInstance().upload(projectId, draft.file, {
                kind: draft.kind,
                parentAssetId: draft.parentAssetId,
            })
            if (draft.attachment) {
                await UploadService.getInstance().upload(projectId, draft.attachment.file, {
                    kind: draft.attachment.kind,
                    parentAssetId: assetId,
                })
            }
            await get().fetchAssets(projectId)
            void get().fetchProjectUsage(projectId)
            return true
        } catch (error) {
            fail(get, error, STRINGS.common.saveFailed)
            return false
        }
    },
})
