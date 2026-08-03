import { apiFetch } from 'helpers/api'
import {
    ApiKey,
    ApiKeyDraft,
    ApiKeyIssued,
    ServiceAccount,
    ServiceAccountDraft,
    UserAccessOverrides,
    UserAccessPayload,
    UserRole,
} from 'types'

class ServiceAccountService {
    private static instance: ServiceAccountService
    private constructor() {}

    static getInstance(): ServiceAccountService {
        if (!ServiceAccountService.instance) ServiceAccountService.instance = new ServiceAccountService()
        return ServiceAccountService.instance
    }

    async list(): Promise<ServiceAccount[]> {
        return apiFetch<ServiceAccount[]>('/api/service-accounts')
    }

    async create(draft: ServiceAccountDraft): Promise<ServiceAccount> {
        return apiFetch<ServiceAccount>('/api/service-accounts', {
            method: 'POST',
            body: JSON.stringify(draft),
        })
    }

    async update(
        id: string,
        patch: { name?: string; role?: UserRole; active?: boolean }
    ): Promise<ServiceAccount> {
        return apiFetch<ServiceAccount>(`/api/service-accounts/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            body: JSON.stringify(patch),
        })
    }

    async remove(id: string): Promise<void> {
        await apiFetch<void>(`/api/service-accounts/${encodeURIComponent(id)}`, { method: 'DELETE' })
    }

    async fetchAccess(id: string): Promise<UserAccessPayload> {
        return apiFetch<UserAccessPayload>(`/api/service-accounts/${encodeURIComponent(id)}/access`)
    }

    async saveAccess(id: string, overrides: UserAccessOverrides): Promise<UserAccessPayload> {
        return apiFetch<UserAccessPayload>(`/api/service-accounts/${encodeURIComponent(id)}/access`, {
            method: 'PUT',
            body: JSON.stringify(overrides),
        })
    }

    async listKeys(id: string): Promise<ApiKey[]> {
        return apiFetch<ApiKey[]>(`/api/service-accounts/${encodeURIComponent(id)}/keys`)
    }

    async createKey(id: string, draft: ApiKeyDraft): Promise<ApiKeyIssued> {
        return apiFetch<ApiKeyIssued>(`/api/service-accounts/${encodeURIComponent(id)}/keys`, {
            method: 'POST',
            body: JSON.stringify(draft),
        })
    }

    async revokeKey(id: string, keyId: string): Promise<void> {
        await apiFetch<void>(
            `/api/service-accounts/${encodeURIComponent(id)}/keys/${encodeURIComponent(keyId)}`,
            { method: 'DELETE' }
        )
    }
}

export default ServiceAccountService
