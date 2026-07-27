import { apiFetch } from 'helpers/api'
import { AccessPolicy, Role, RoleBindings, RoleDraft, UserAccessOverrides, UserAccessPayload } from 'types'

class AccessPolicyService {
    private static instance: AccessPolicyService
    private constructor() {}

    static getInstance(): AccessPolicyService {
        if (!AccessPolicyService.instance) AccessPolicyService.instance = new AccessPolicyService()
        return AccessPolicyService.instance
    }

    async fetchPolicy(): Promise<AccessPolicy> {
        return apiFetch<AccessPolicy>('/api/access-policy')
    }

    async fetchRoles(): Promise<Role[]> {
        return apiFetch<Role[]>('/api/roles')
    }

    async createRole(draft: RoleDraft): Promise<Role> {
        return apiFetch<Role>('/api/roles', { method: 'POST', body: JSON.stringify(draft) })
    }

    async updateRole(roleId: string, draft: RoleDraft): Promise<Role> {
        return apiFetch<Role>(`/api/roles/${roleId}`, { method: 'PUT', body: JSON.stringify(draft) })
    }

    async deleteRole(roleId: string): Promise<void> {
        await apiFetch<void>(`/api/roles/${roleId}`, { method: 'DELETE' })
    }

    async reassignRole(roleId: string, toRoleId: string): Promise<{ moved: number }> {
        return apiFetch<{ moved: number }>(`/api/roles/${roleId}/reassign`, {
            method: 'POST',
            body: JSON.stringify({ toRoleId }),
        })
    }

    async saveLimits(roleLimits: AccessPolicy['roleLimits']): Promise<AccessPolicy> {
        return apiFetch<AccessPolicy>('/api/access-policy/limits', {
            method: 'PUT',
            body: JSON.stringify({ roleLimits }),
        })
    }

    async saveBindings(bindings: Partial<RoleBindings>): Promise<RoleBindings> {
        return apiFetch<RoleBindings>('/api/access-policy/bindings', {
            method: 'PUT',
            body: JSON.stringify(bindings),
        })
    }

    async fetchUserAccess(userId: string): Promise<UserAccessPayload> {
        return apiFetch<UserAccessPayload>(`/api/users/${userId}/access`)
    }

    async saveUserAccess(userId: string, overrides: UserAccessOverrides): Promise<UserAccessPayload> {
        return apiFetch<UserAccessPayload>(`/api/users/${userId}/access`, {
            method: 'PUT',
            body: JSON.stringify(overrides),
        })
    }
}

export default AccessPolicyService
