import { apiFetch } from 'helpers/api'
import { queryString } from 'helpers/query'
import {
    OpenRole,
    RoleApplication,
    RoleApplicationDecision,
    RoleApplicationDraft,
    RoleApplicationFilters,
} from 'types'

class RoleApplicationService {
    private static instance: RoleApplicationService
    private constructor() {}

    static getInstance(): RoleApplicationService {
        if (!RoleApplicationService.instance) RoleApplicationService.instance = new RoleApplicationService()
        return RoleApplicationService.instance
    }

    async openRoles(): Promise<OpenRole[]> {
        return apiFetch<OpenRole[]>('/api/role-applications/open-roles')
    }

    async mine(): Promise<RoleApplication[]> {
        return apiFetch<RoleApplication[]>('/api/role-applications/mine')
    }

    async apply(draft: RoleApplicationDraft): Promise<RoleApplication> {
        return apiFetch<RoleApplication>('/api/role-applications', {
            method: 'POST',
            body: JSON.stringify(draft),
        })
    }

    async withdraw(applicationId: string): Promise<RoleApplication> {
        return apiFetch<RoleApplication>(
            `/api/role-applications/${encodeURIComponent(applicationId)}/withdraw`,
            { method: 'POST' }
        )
    }

    async list(filters: RoleApplicationFilters): Promise<{ applications: RoleApplication[]; total: number }> {
        return apiFetch<{ applications: RoleApplication[]; total: number }>(
            `/api/role-applications${queryString(filters)}`
        )
    }

    async decide(applicationId: string, decision: RoleApplicationDecision): Promise<RoleApplication> {
        return apiFetch<RoleApplication>(
            `/api/role-applications/${encodeURIComponent(applicationId)}/decision`,
            { method: 'POST', body: JSON.stringify(decision) }
        )
    }
}

export default RoleApplicationService
