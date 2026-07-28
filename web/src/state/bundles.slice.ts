import { StateCreator } from 'zustand'
import BundleService from 'services/BundleService'
import { STRINGS } from 'configs/strings'
import { Bundle, BundleDraft, BundlePreview, BundleRule } from 'types'
import type { AppStore } from './index'

export type BundlesSlice = {
    bundles: Bundle[]
    bundlesLoaded: boolean
    preview: BundlePreview | null
    previewLoading: boolean

    fetchBundles: (projectId: string) => Promise<void>
    previewRule: (projectId: string, rule: BundleRule) => Promise<void>
    createBundle: (projectId: string, draft: BundleDraft) => Promise<Bundle | null>
    updateBundle: (projectId: string, bundleId: string, draft: Partial<BundleDraft>) => Promise<boolean>
    deleteBundle: (projectId: string, bundleId: string) => Promise<boolean>
}

const fail = (get: () => AppStore, error: unknown, fallback: string) =>
    get().addAlert({
        variant: 'danger',
        message: error instanceof Error ? error.message : fallback,
        dismissible: true,
    })

export const createBundlesSlice: StateCreator<AppStore, [], [], BundlesSlice> = (set, get) => ({
    bundles: [],
    bundlesLoaded: false,
    preview: null,
    previewLoading: false,

    async fetchBundles(projectId) {
        try {
            set({ bundles: await BundleService.getInstance().list(projectId), bundlesLoaded: true })
        } catch (error) {
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async previewRule(projectId, rule) {
        set({ previewLoading: true })
        try {
            set({ preview: await BundleService.getInstance().preview(projectId, rule) })
        } catch (error) {
            fail(get, error, STRINGS.common.loadFailed)
        } finally {
            set({ previewLoading: false })
        }
    },

    async createBundle(projectId, draft) {
        try {
            const created = await BundleService.getInstance().create(projectId, draft)
            await get().fetchBundles(projectId)
            void get().fetchProjectUsage(projectId)
            return created
        } catch (error) {
            fail(get, error, STRINGS.common.saveFailed)
            return null
        }
    },

    async updateBundle(projectId, bundleId, draft) {
        try {
            const updated = await BundleService.getInstance().update(projectId, bundleId, draft)
            set({ bundles: get().bundles.map((bundle) => (bundle.id === bundleId ? updated : bundle)) })
            return true
        } catch (error) {
            fail(get, error, STRINGS.common.saveFailed)
            return false
        }
    },

    async deleteBundle(projectId, bundleId) {
        try {
            await BundleService.getInstance().remove(projectId, bundleId)
            set({ bundles: get().bundles.filter((bundle) => bundle.id !== bundleId) })
            void get().fetchProjectUsage(projectId)
            return true
        } catch (error) {
            fail(get, error, STRINGS.common.saveFailed)
            return false
        }
    },
})
