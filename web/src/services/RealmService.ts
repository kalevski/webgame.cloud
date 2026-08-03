import { apiFetch } from 'helpers/api'
import {
    ProjectMigration,
    Realm,
    RealmDraft,
    RealmRegion,
    RealmRegionDraft,
    RealmSamplePoint,
    RealmStats,
    RealmToken,
} from 'types'

class RealmService {
    private static instance: RealmService
    private constructor() {}

    static getInstance(): RealmService {
        if (!RealmService.instance) RealmService.instance = new RealmService()
        return RealmService.instance
    }

    async list(): Promise<Realm[]> {
        return apiFetch<Realm[]>('/api/realms')
    }

    async find(id: string): Promise<Realm> {
        return apiFetch<Realm>(`/api/realms/${encodeURIComponent(id)}`)
    }

    async stats(id: string): Promise<RealmStats> {
        return apiFetch<RealmStats>(`/api/realms/${encodeURIComponent(id)}/stats`)
    }

    async samples(id: string): Promise<RealmSamplePoint[]> {
        return apiFetch<RealmSamplePoint[]>(`/api/realms/${encodeURIComponent(id)}/samples`)
    }

    async create(draft: RealmDraft): Promise<RealmToken> {
        return apiFetch<RealmToken>('/api/realms', { method: 'POST', body: JSON.stringify(draft) })
    }

    async update(id: string, draft: Partial<RealmDraft>): Promise<Realm> {
        return apiFetch<Realm>(`/api/realms/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            body: JSON.stringify(draft),
        })
    }

    async remove(id: string): Promise<void> {
        await apiFetch<void>(`/api/realms/${encodeURIComponent(id)}`, { method: 'DELETE' })
    }

    async rotateToken(id: string): Promise<RealmToken> {
        return apiFetch<RealmToken>(`/api/realms/${encodeURIComponent(id)}/token`, { method: 'POST' })
    }

    async listRegions(): Promise<RealmRegion[]> {
        return apiFetch<RealmRegion[]>('/api/realm-regions')
    }

    async createRegion(draft: RealmRegionDraft): Promise<RealmRegion> {
        return apiFetch<RealmRegion>('/api/realm-regions', {
            method: 'POST',
            body: JSON.stringify(draft),
        })
    }

    async updateRegion(id: string, draft: Partial<RealmRegionDraft>): Promise<RealmRegion> {
        return apiFetch<RealmRegion>(`/api/realm-regions/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            body: JSON.stringify(draft),
        })
    }

    async removeRegion(id: string): Promise<void> {
        await apiFetch<void>(`/api/realm-regions/${encodeURIComponent(id)}`, { method: 'DELETE' })
    }

    async moveProject(projectId: string, realmId: string): Promise<ProjectMigration> {
        return apiFetch<ProjectMigration>(`/api/admin/projects/${encodeURIComponent(projectId)}/move`, {
            method: 'POST',
            body: JSON.stringify({ realmId }),
        })
    }
}

export default RealmService
