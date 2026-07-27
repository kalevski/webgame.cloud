import { apiFetch } from 'helpers/api'
import { AuthConfig, AuthSession, User } from 'types'

class AuthService {
    private static instance: AuthService
    private constructor() {}

    static getInstance(): AuthService {
        if (!AuthService.instance) AuthService.instance = new AuthService()
        return AuthService.instance
    }

    async config(): Promise<AuthConfig> {
        return apiFetch<AuthConfig>('/api/config')
    }

    async me(): Promise<AuthSession | null> {
        try {
            return await apiFetch<AuthSession>('/api/auth/me')
        } catch {
            return null
        }
    }

    async loginDev(email: string, name?: string): Promise<User> {
        return apiFetch<User>('/api/auth/dev', {
            method: 'POST',
            body: JSON.stringify({ email, ...(name ? { name } : {}) }),
        })
    }

    async logout(): Promise<void> {
        await apiFetch<void>('/api/auth/logout', { method: 'POST' })
    }
}

export default AuthService
