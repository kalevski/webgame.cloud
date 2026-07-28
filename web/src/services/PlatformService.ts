import { apiFetch } from 'helpers/api'
import {
    ApiKey,
    ApiKeyDraft,
    ApiKeyIssued,
    AssetSource,
    AssetSourceDraft,
    AssetType,
    AssetTypeBindings,
    Job,
    JobFilters,
    JobRunResult,
    JobSchedule,
    JobStats,
    PurgeRun,
    PurgeSettings,
    RetentionPolicy,
    RetentionReport,
    SigningKey,
    StoredFile,
    WebhookDelivery,
    WebhookDeliveryFilters,
    WebhookEndpoint,
    WebhookEndpointDraft,
} from 'types'

class PlatformService {
    private static instance: PlatformService
    private constructor() {}

    static getInstance(): PlatformService {
        if (!PlatformService.instance) PlatformService.instance = new PlatformService()
        return PlatformService.instance
    }

    async listApiKeys(): Promise<ApiKey[]> {
        return apiFetch<ApiKey[]>('/api/account/api-keys')
    }

    async createApiKey(draft: ApiKeyDraft): Promise<ApiKeyIssued> {
        return apiFetch<ApiKeyIssued>('/api/account/api-keys', {
            method: 'POST',
            body: JSON.stringify(draft),
        })
    }

    async revokeApiKey(keyId: string): Promise<void> {
        await apiFetch<void>(`/api/account/api-keys/${encodeURIComponent(keyId)}`, { method: 'DELETE' })
    }

    async listWebhooks(): Promise<WebhookEndpoint[]> {
        return apiFetch<WebhookEndpoint[]>('/api/webhooks')
    }

    async createWebhook(draft: WebhookEndpointDraft): Promise<WebhookEndpoint> {
        return apiFetch<WebhookEndpoint>('/api/webhooks', { method: 'POST', body: JSON.stringify(draft) })
    }

    async updateWebhook(endpointId: string, patch: Partial<WebhookEndpointDraft>): Promise<WebhookEndpoint> {
        return apiFetch<WebhookEndpoint>(`/api/webhooks/${encodeURIComponent(endpointId)}`, {
            method: 'PATCH',
            body: JSON.stringify(patch),
        })
    }

    async deleteWebhook(endpointId: string): Promise<void> {
        await apiFetch<void>(`/api/webhooks/${encodeURIComponent(endpointId)}`, { method: 'DELETE' })
    }

    async listWebhookEvents(): Promise<string[]> {
        return apiFetch<string[]>('/api/webhooks/events')
    }

    async listDeliveries(filters: WebhookDeliveryFilters): Promise<{ deliveries: WebhookDelivery[]; total: number }> {
        const query = new URLSearchParams()
        for (const [key, value] of Object.entries(filters)) {
            if (value !== undefined && value !== null && value !== '') query.set(key, String(value))
        }
        const suffix = query.toString()
        return apiFetch<{ deliveries: WebhookDelivery[]; total: number }>(
            `/api/webhooks/deliveries${suffix ? `?${suffix}` : ''}`
        )
    }

    async listAssetSources(): Promise<AssetSource[]> {
        return apiFetch<AssetSource[]>('/api/asset-sources')
    }

    async createAssetSource(draft: AssetSourceDraft): Promise<AssetSource> {
        return apiFetch<AssetSource>('/api/asset-sources', { method: 'POST', body: JSON.stringify(draft) })
    }

    async updateAssetSource(sourceId: string, patch: Partial<AssetSourceDraft>): Promise<AssetSource> {
        return apiFetch<AssetSource>(`/api/asset-sources/${encodeURIComponent(sourceId)}`, {
            method: 'PATCH',
            body: JSON.stringify(patch),
        })
    }

    async deleteAssetSource(sourceId: string): Promise<void> {
        await apiFetch<void>(`/api/asset-sources/${encodeURIComponent(sourceId)}`, { method: 'DELETE' })
    }

    async getFileBindings(): Promise<AssetTypeBindings> {
        return apiFetch<AssetTypeBindings>('/api/asset-sources/bindings')
    }

    async saveFileBindings(patch: Partial<AssetTypeBindings>): Promise<AssetTypeBindings> {
        return apiFetch<AssetTypeBindings>('/api/asset-sources/bindings', {
            method: 'PUT',
            body: JSON.stringify(patch),
        })
    }

    async uploadFile(assetType: AssetType, file: File): Promise<StoredFile> {
        const formData = new FormData()
        formData.append('assetType', assetType)
        formData.append('file', file)
        return apiFetch<StoredFile>('/api/files', { method: 'POST', body: formData, headers: {} })
    }

    async deleteFile(fileId: string): Promise<void> {
        await apiFetch<void>(`/api/files/${encodeURIComponent(fileId)}`, { method: 'DELETE' })
    }

    async listJobSchedules(): Promise<JobSchedule[]> {
        return apiFetch<JobSchedule[]>('/api/jobs/schedules')
    }

    async runJobSchedules(kinds: string[] = []): Promise<JobRunResult> {
        return apiFetch<JobRunResult>('/api/jobs/schedules/run', {
            method: 'POST',
            body: JSON.stringify({ kinds }),
        })
    }

    async listJobs(
        filters: JobFilters
    ): Promise<{ jobs: Job[]; total: number; stats: JobStats; nextCursor: string | null }> {
        const query = new URLSearchParams()
        for (const [key, value] of Object.entries(filters)) {
            if (value !== undefined && value !== null && value !== '') query.set(key, String(value))
        }
        const suffix = query.toString()
        return apiFetch<{ jobs: Job[]; total: number; stats: JobStats; nextCursor: string | null }>(
            `/api/jobs${suffix ? `?${suffix}` : ''}`
        )
    }

    async getRetention(): Promise<RetentionReport> {
        return apiFetch<RetentionReport>('/api/retention')
    }

    async saveRetention(policy: RetentionPolicy): Promise<RetentionReport> {
        return apiFetch<RetentionReport>('/api/retention', { method: 'PUT', body: JSON.stringify(policy) })
    }

    async savePurgeSettings(patch: Partial<PurgeSettings>): Promise<PurgeSettings> {
        return apiFetch<PurgeSettings>('/api/retention/settings', { method: 'PUT', body: JSON.stringify(patch) })
    }

    async runPurge(): Promise<PurgeRun> {
        return apiFetch<PurgeRun>('/api/retention/run', { method: 'POST' })
    }

    async listSigningKeys(): Promise<SigningKey[]> {
        return apiFetch<SigningKey[]>('/api/signing-keys')
    }

    async rotateSigningKey(name: string): Promise<SigningKey> {
        return apiFetch<SigningKey>(`/api/signing-keys/${encodeURIComponent(name)}/rotate`, {
            method: 'POST',
        })
    }
}

export default PlatformService
