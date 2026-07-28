import { StateCreator } from 'zustand'
import AssetService from 'services/AssetService'
import UploadService from 'services/UploadService'
import { STRINGS } from 'configs/strings'
import { AssetFile, AssetPatch } from 'types'
import type { AppStore } from './index'

export type QueuedUpload = {
    id: string
    name: string
    size: number
    loaded: number
    status: 'waiting' | 'uploading' | 'done' | 'failed'
    error?: string
}

export type AssetsSlice = {
    assets: AssetFile[]
    assetsLoaded: boolean
    queue: QueuedUpload[]
    dirty: Record<string, AssetPatch>
    rejected: string[]

    fetchAssets: (projectId: string) => Promise<void>
    enqueueUploads: (projectId: string, files: File[], categoryId?: string) => Promise<void>
    stageEdit: (patch: AssetPatch) => void
    discardEdits: () => void
    saveEdits: (projectId: string) => Promise<boolean>
    deleteAsset: (projectId: string, assetId: string) => Promise<boolean>
    clearQueue: () => void
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

    async enqueueUploads(projectId, files, categoryId) {
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
                    categoryId,
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
})
