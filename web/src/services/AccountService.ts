import { apiFetch } from 'helpers/api'
import { AccountExport, OAuthProvider, User, UserIdentity, UserSession } from 'types'

class AccountService {
    private static instance: AccountService
    private constructor() {}

    static getInstance(): AccountService {
        if (!AccountService.instance) AccountService.instance = new AccountService()
        return AccountService.instance
    }

    async acceptConsent(): Promise<User> {
        return apiFetch<User>('/api/account/consent', { method: 'POST' })
    }

    async updateName(name: string): Promise<User> {
        return apiFetch<User>('/api/account/name', { method: 'PUT', body: JSON.stringify({ name }) })
    }

    async listIdentities(): Promise<UserIdentity[]> {
        return apiFetch<UserIdentity[]>('/api/account/identities')
    }

    async unlinkIdentity(provider: OAuthProvider): Promise<void> {
        await apiFetch<void>(`/api/account/identities/${encodeURIComponent(provider)}`, { method: 'DELETE' })
    }

    async listSessions(): Promise<UserSession[]> {
        return apiFetch<UserSession[]>('/api/account/sessions')
    }

    async revokeSession(id: string): Promise<void> {
        await apiFetch<void>(`/api/account/sessions/${encodeURIComponent(id)}`, { method: 'DELETE' })
    }

    async exportData(): Promise<AccountExport> {
        return apiFetch<AccountExport>('/api/account/export')
    }

    async deleteAccount(): Promise<void> {
        await apiFetch<void>('/api/account', { method: 'DELETE' })
    }
}

export default AccountService
