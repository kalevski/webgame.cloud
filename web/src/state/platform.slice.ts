import { StateCreator } from 'zustand'
import { AppStore } from 'state'
import { STRINGS } from 'configs/strings'
import PlatformService from 'services/PlatformService'
import { fail } from './alerts.slice'
import {
    ApiKey,
    ApiKeyDraft,
    ApiKeyIssued,
    AssetSource,
    AssetSourceDraft,
    AssetTypeBindings,
    Job,
    JobFilters,
    JobSchedule,
    JobStats,
    PurgeSettings,
    RetentionPolicy,
    RetentionReport,
    SigningKey,
    WebhookDelivery,
    WebhookDeliveryFilters,
    WebhookEndpoint,
    WebhookEndpointDraft,
} from 'types'

export type PlatformSlice = {
    apiKeys: ApiKey[]
    apiKeysLoaded: boolean
    fetchApiKeys: () => Promise<void>
    createApiKey: (draft: ApiKeyDraft) => Promise<ApiKeyIssued | null>
    revokeApiKey: (keyId: string) => Promise<boolean>

    webhooks: WebhookEndpoint[]
    webhooksLoaded: boolean
    webhookEvents: string[]
    fetchWebhooks: () => Promise<void>
    fetchWebhookEvents: () => Promise<void>
    saveWebhook: (endpointId: string | null, draft: WebhookEndpointDraft) => Promise<WebhookEndpoint | null>
    deleteWebhook: (endpointId: string) => Promise<boolean>

    deliveries: WebhookDelivery[]
    deliveriesTotal: number
    deliveriesLoading: boolean
    deliveryFilters: WebhookDeliveryFilters
    fetchDeliveries: (filters?: WebhookDeliveryFilters) => Promise<void>

    assetSources: AssetSource[]
    assetSourcesLoaded: boolean
    fileBindings: AssetTypeBindings | null
    fetchAssetSources: () => Promise<void>
    fetchFileBindings: () => Promise<void>
    saveAssetSource: (sourceId: string | null, draft: AssetSourceDraft) => Promise<AssetSource | null>
    deleteAssetSource: (sourceId: string) => Promise<boolean>
    saveFileBindings: (patch: Partial<AssetTypeBindings>) => Promise<AssetTypeBindings | null>

    jobSchedules: JobSchedule[]
    jobSchedulesLoaded: boolean
    jobs: Job[]
    jobStats: JobStats | null
    jobsLoading: boolean
    jobFilters: JobFilters
    jobsNextCursor: string | null
    fetchJobSchedules: () => Promise<void>
    fetchJobs: (filters?: JobFilters) => Promise<void>
    fetchMoreJobs: () => Promise<void>
    runJobs: (kinds?: string[]) => Promise<boolean>

    retention: RetentionReport | null
    retentionLoading: boolean
    fetchRetention: () => Promise<void>
    saveRetention: (policy: RetentionPolicy) => Promise<boolean>
    savePurgeSettings: (patch: Partial<PurgeSettings>) => Promise<boolean>
    runPurge: () => Promise<boolean>

    signingKeys: SigningKey[]
    signingKeysLoaded: boolean
    fetchSigningKeys: () => Promise<void>
    rotateSigningKey: (name: string) => Promise<boolean>

}

export const createPlatformSlice: StateCreator<AppStore, [], [], PlatformSlice> = (set, get) => ({
    apiKeys: [],
    apiKeysLoaded: false,
    webhooks: [],
    webhooksLoaded: false,
    webhookEvents: [],
    deliveries: [],
    deliveriesTotal: 0,
    deliveriesLoading: false,
    deliveryFilters: { limit: 25, offset: 0 },

    assetSources: [],
    assetSourcesLoaded: false,
    fileBindings: null,

    jobSchedules: [],
    jobSchedulesLoaded: false,
    jobs: [],
    jobStats: null,
    jobsLoading: false,
    jobFilters: { limit: 10, offset: 0 },
    jobsNextCursor: null,

    retention: null,
    retentionLoading: false,

    signingKeys: [],
    signingKeysLoaded: false,

    async fetchApiKeys() {
        try {
            const apiKeys = await PlatformService.getInstance().listApiKeys()
            set({ apiKeys, apiKeysLoaded: true })
        } catch (error) {
            set({ apiKeysLoaded: true })
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async createApiKey(draft) {
        try {
            const issued = await PlatformService.getInstance().createApiKey(draft)
            await get().fetchApiKeys()
            get().addAlert({ variant: 'success', message: STRINGS.apiKeys.created, dismissible: true })
            return issued
        } catch (error) {
            fail(get, error, STRINGS.apiKeys.saveFailed)
            return null
        }
    },

    async revokeApiKey(keyId) {
        try {
            await PlatformService.getInstance().revokeApiKey(keyId)
            await get().fetchApiKeys()
            get().addAlert({ variant: 'success', message: STRINGS.apiKeys.revoked, dismissible: true })
            return true
        } catch (error) {
            fail(get, error, STRINGS.apiKeys.saveFailed)
            return false
        }
    },

    async fetchWebhooks() {
        try {
            const webhooks = await PlatformService.getInstance().listWebhooks()
            set({ webhooks, webhooksLoaded: true })
        } catch (error) {
            set({ webhooksLoaded: true })
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async fetchWebhookEvents() {
        try {
            set({ webhookEvents: await PlatformService.getInstance().listWebhookEvents() })
        } catch (error) {
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async saveWebhook(endpointId, draft) {
        try {
            const saved = endpointId
                ? await PlatformService.getInstance().updateWebhook(endpointId, draft)
                : await PlatformService.getInstance().createWebhook(draft)
            await get().fetchWebhooks()
            get().addAlert({ variant: 'success', message: STRINGS.webhooks.saved, dismissible: true })
            return saved
        } catch (error) {
            fail(get, error, STRINGS.webhooks.saveFailed)
            return null
        }
    },

    async deleteWebhook(endpointId) {
        try {
            await PlatformService.getInstance().deleteWebhook(endpointId)
            await get().fetchWebhooks()
            get().addAlert({ variant: 'success', message: STRINGS.webhooks.deleted, dismissible: true })
            return true
        } catch (error) {
            fail(get, error, STRINGS.webhooks.saveFailed)
            return false
        }
    },

    async fetchDeliveries(filters) {
        const next = { ...get().deliveryFilters, ...filters }
        set({ deliveriesLoading: true, deliveryFilters: next })
        try {
            const { deliveries, total } = await PlatformService.getInstance().listDeliveries(next)
            set({ deliveries, deliveriesTotal: total, deliveriesLoading: false })
        } catch (error) {
            set({ deliveriesLoading: false })
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async fetchAssetSources() {
        try {
            const assetSources = await PlatformService.getInstance().listAssetSources()
            set({ assetSources, assetSourcesLoaded: true })
        } catch (error) {
            set({ assetSourcesLoaded: true })
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async fetchFileBindings() {
        try {
            set({ fileBindings: await PlatformService.getInstance().getFileBindings() })
        } catch (error) {
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async saveAssetSource(sourceId, draft) {
        try {
            const saved = sourceId
                ? await PlatformService.getInstance().updateAssetSource(sourceId, draft)
                : await PlatformService.getInstance().createAssetSource(draft)
            await get().fetchAssetSources()
            get().addAlert({ variant: 'success', message: STRINGS.files.sourceSaved, dismissible: true })
            return saved
        } catch (error) {
            fail(get, error, STRINGS.files.saveFailed)
            return null
        }
    },

    async deleteAssetSource(sourceId) {
        try {
            await PlatformService.getInstance().deleteAssetSource(sourceId)
            await Promise.all([get().fetchAssetSources(), get().fetchFileBindings()])
            get().addAlert({ variant: 'success', message: STRINGS.files.sourceDeleted, dismissible: true })
            return true
        } catch (error) {
            fail(get, error, STRINGS.files.saveFailed)
            return false
        }
    },

    async saveFileBindings(patch) {
        try {
            const saved = await PlatformService.getInstance().saveFileBindings(patch)
            set({ fileBindings: saved })
            get().addAlert({ variant: 'success', message: STRINGS.files.bindingsSaved, dismissible: true })
            return saved
        } catch (error) {
            fail(get, error, STRINGS.files.saveFailed)
            return null
        }
    },

    async fetchJobSchedules() {
        try {
            const jobSchedules = await PlatformService.getInstance().listJobSchedules()
            set({ jobSchedules, jobSchedulesLoaded: true })
        } catch (error) {
            set({ jobSchedulesLoaded: true })
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async fetchJobs(filters) {
        const next = { ...get().jobFilters, ...filters, cursor: undefined }
        set({ jobsLoading: true, jobFilters: next })
        try {
            const { jobs, stats, nextCursor } = await PlatformService.getInstance().listJobs(next)
            set({ jobs, jobStats: stats, jobsNextCursor: nextCursor, jobsLoading: false })
        } catch (error) {
            set({ jobsLoading: false })
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async fetchMoreJobs() {
        const cursor = get().jobsNextCursor
        if (!cursor || get().jobsLoading) return

        set({ jobsLoading: true })
        try {
            const { jobs, stats, nextCursor } = await PlatformService.getInstance().listJobs({
                ...get().jobFilters,
                cursor,
            })
            set({
                jobs: [...get().jobs, ...jobs],
                jobStats: stats,
                jobsNextCursor: nextCursor,
                jobsLoading: false,
            })
        } catch (error) {
            set({ jobsLoading: false })
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async runJobs(kinds = []) {
        try {
            const { triggered } = await PlatformService.getInstance().runJobSchedules(kinds)
            get().addAlert({
                variant: 'success',
                message: STRINGS.jobs.triggered(triggered.length),
                dismissible: true,
            })
            await Promise.all([get().fetchJobSchedules(), get().fetchJobs()])
            return true
        } catch (error) {
            fail(get, error, STRINGS.jobs.runFailed)
            return false
        }
    },

    async fetchRetention() {
        set({ retentionLoading: true })
        try {
            set({ retention: await PlatformService.getInstance().getRetention(), retentionLoading: false })
        } catch (error) {
            set({ retentionLoading: false })
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async saveRetention(policy) {
        try {
            set({ retention: await PlatformService.getInstance().saveRetention(policy) })
            get().addAlert({ variant: 'success', message: STRINGS.retention.saved, dismissible: true })
            return true
        } catch (error) {
            fail(get, error, STRINGS.retention.saveFailed)
            return false
        }
    },

    async savePurgeSettings(patch) {
        try {
            await PlatformService.getInstance().savePurgeSettings(patch)
            await get().fetchRetention()
            get().addAlert({ variant: 'success', message: STRINGS.retention.saved, dismissible: true })
            return true
        } catch (error) {
            fail(get, error, STRINGS.retention.saveFailed)
            return false
        }
    },

    async runPurge() {
        try {
            const run = await PlatformService.getInstance().runPurge()
            await get().fetchRetention()
            get().addAlert({ variant: 'success', message: STRINGS.retention.runFinished(run.deleted), dismissible: true })
            return true
        } catch (error) {
            fail(get, error, STRINGS.retention.saveFailed)
            return false
        }
    },

    async fetchSigningKeys() {
        try {
            const signingKeys = await PlatformService.getInstance().listSigningKeys()
            set({ signingKeys, signingKeysLoaded: true })
        } catch {
            set({ signingKeysLoaded: true })
        }
    },

    async rotateSigningKey(name) {
        try {
            await PlatformService.getInstance().rotateSigningKey(name)
            await get().fetchSigningKeys()
            get().addAlert({ variant: 'success', message: STRINGS.signingKeys.rotated, dismissible: true })
            return true
        } catch (error) {
            fail(get, error, STRINGS.signingKeys.rotateFailed)
            return false
        }
    },
})
