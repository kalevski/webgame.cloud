import { apiFetch } from 'helpers/api'
import { AdminOverview, AdminUserProfile, PlatformSettings, User, UserRole } from 'types'

class UserService {
    private static instance: UserService
    private constructor() {}

    static getInstance(): UserService {
        if (!UserService.instance) UserService.instance = new UserService()
        return UserService.instance
    }

    async fetchUsers(): Promise<User[]> {
        return apiFetch<User[]>('/api/users')
    }

    async fetchProfile(id: string): Promise<AdminUserProfile> {
        return apiFetch<AdminUserProfile>(`/api/users/${encodeURIComponent(id)}/profile`)
    }

    async createUser(draft: { email: string; name?: string; role?: UserRole }): Promise<User> {
        return apiFetch<User>('/api/users', { method: 'POST', body: JSON.stringify(draft) })
    }

    async impersonateUser(id: string): Promise<User> {
        return apiFetch<User>(`/api/users/${encodeURIComponent(id)}/impersonate`, { method: 'POST' })
    }

    async updateUser(id: string, patch: { role?: UserRole; active?: boolean; verified?: boolean }): Promise<User> {
        return apiFetch<User>(`/api/users/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            body: JSON.stringify(patch),
        })
    }

    async fetchOverview(): Promise<AdminOverview> {
        return apiFetch<AdminOverview>('/api/admin/overview')
    }

    async fetchSettings(): Promise<PlatformSettings> {
        return apiFetch<PlatformSettings>('/api/settings')
    }

    async updateSettings(settings: PlatformSettings): Promise<PlatformSettings> {
        return apiFetch<PlatformSettings>('/api/settings', {
            method: 'PUT',
            body: JSON.stringify(settings),
        })
    }
}

export default UserService
