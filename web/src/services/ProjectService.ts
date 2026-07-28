import { apiFetch } from 'helpers/api'
import {
    InviteDraft,
    LimitUsage,
    Project,
    ProjectDraft,
    ProjectInvite,
    ProjectLock,
    ProjectMember,
    ProjectPermission,
    ProjectVocabularies,
    VocabulariesDraft,
} from 'types'

const base = (id: string) => `/api/projects/${encodeURIComponent(id)}`

class ProjectService {
    private static instance: ProjectService
    private constructor() {}

    static getInstance(): ProjectService {
        if (!ProjectService.instance) ProjectService.instance = new ProjectService()
        return ProjectService.instance
    }

    async list(archived = false): Promise<Project[]> {
        return apiFetch<Project[]>(`/api/projects${archived ? '?archived=true' : ''}`)
    }

    async get(id: string): Promise<Project> {
        return apiFetch<Project>(base(id))
    }

    async create(draft: ProjectDraft): Promise<Project> {
        return apiFetch<Project>('/api/projects', { method: 'POST', body: JSON.stringify(draft) })
    }

    async update(id: string, patch: Partial<ProjectDraft> & { defaultCategoryId?: string | null }): Promise<Project> {
        return apiFetch<Project>(base(id), { method: 'PATCH', body: JSON.stringify(patch) })
    }

    async archive(id: string, archived: boolean): Promise<Project> {
        return apiFetch<Project>(`${base(id)}/archive`, {
            method: 'POST',
            body: JSON.stringify({ archived }),
        })
    }

    async transfer(id: string, userId: string): Promise<void> {
        await apiFetch<void>(`${base(id)}/transfer`, {
            method: 'POST',
            body: JSON.stringify({ userId }),
        })
    }

    async remove(id: string): Promise<void> {
        await apiFetch<{ deleted: boolean }>(base(id), { method: 'DELETE' })
    }

    async usage(id: string): Promise<LimitUsage[]> {
        return apiFetch<LimitUsage[]>(`${base(id)}/usage`)
    }

    async lock(id: string): Promise<ProjectLock> {
        return apiFetch<ProjectLock>(`${base(id)}/lock`)
    }

    async vocabularies(id: string): Promise<ProjectVocabularies> {
        return apiFetch<ProjectVocabularies>(`${base(id)}/vocabularies`)
    }

    async saveVocabularies(id: string, draft: VocabulariesDraft): Promise<ProjectVocabularies> {
        return apiFetch<ProjectVocabularies>(`${base(id)}/vocabularies`, {
            method: 'PUT',
            body: JSON.stringify(draft),
        })
    }

    async members(id: string): Promise<ProjectMember[]> {
        return apiFetch<ProjectMember[]>(`${base(id)}/members`)
    }

    async setMemberPermissions(
        id: string,
        memberId: string,
        permissions: ProjectPermission[]
    ): Promise<ProjectMember> {
        return apiFetch<ProjectMember>(`${base(id)}/members/${encodeURIComponent(memberId)}`, {
            method: 'PATCH',
            body: JSON.stringify({ permissions }),
        })
    }

    async removeMember(id: string, memberId: string): Promise<void> {
        await apiFetch<void>(`${base(id)}/members/${encodeURIComponent(memberId)}`, { method: 'DELETE' })
    }

    async leave(id: string): Promise<void> {
        await apiFetch<void>(`${base(id)}/members/me`, { method: 'DELETE' })
    }

    async invites(id: string): Promise<ProjectInvite[]> {
        return apiFetch<ProjectInvite[]>(`${base(id)}/invites`)
    }

    async invite(id: string, draft: InviteDraft): Promise<ProjectInvite> {
        return apiFetch<ProjectInvite>(`${base(id)}/invites`, {
            method: 'POST',
            body: JSON.stringify(draft),
        })
    }

    async revokeInvite(id: string, inviteId: string): Promise<void> {
        await apiFetch<void>(`${base(id)}/invites/${encodeURIComponent(inviteId)}`, { method: 'DELETE' })
    }

    async myInvites(): Promise<ProjectInvite[]> {
        return apiFetch<ProjectInvite[]>('/api/invites')
    }

    async acceptInvite(inviteId: string): Promise<Project> {
        return apiFetch<Project>(`/api/invites/${encodeURIComponent(inviteId)}/accept`, { method: 'POST' })
    }

    async declineInvite(inviteId: string): Promise<void> {
        await apiFetch<void>(`/api/invites/${encodeURIComponent(inviteId)}/decline`, { method: 'POST' })
    }
}

export default ProjectService
