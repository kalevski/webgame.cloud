import { StateCreator } from 'zustand'
import AccountService from 'services/AccountService'
import AuthService from 'services/AuthService'
import { STRINGS } from 'configs/strings'
import { downloadTextFile } from 'helpers/download'
import { readFromStorage, removeFromStorage, writeToStorage } from 'helpers/storage'
import { setForbiddenHandler } from 'helpers/api'
import { AuthConfig, AuthSession, LIMITABLE_RESOURCES, OAuthProvider, OAUTH_PROVIDER_LABELS, Permission, ResolvedLimits, User, UserIdentity, UserSession } from 'types'
import type { AppStore } from './index'
import { fail } from './alerts.slice'

const SESSION_HINT = 'has-session'

const NO_RESOURCE_LIMITS = Object.fromEntries(
    LIMITABLE_RESOURCES.map((resource) => [resource, null])
) as ResolvedLimits
const NO_SLOTS: AuthSession['slots'] = {
    owner: false, default: false,
}

export type AuthSlice = {
    me: User | null

    permissions: Permission[]

    resourceLimits: ResolvedLimits

    slots: AuthSession['slots']

    roleName: string | null

    impersonatedBy: AuthSession['impersonatedBy']

    paid: boolean

    upgradePlanName: string | null

    authLoaded: boolean
    authConfig: AuthConfig | null
    fetchAuth: () => Promise<void>

    refreshSession: () => Promise<void>

    identities: UserIdentity[]
    identitiesLoaded: boolean
    fetchIdentities: () => Promise<void>
    unlinkIdentity: (provider: OAuthProvider) => Promise<boolean>

    sessions: UserSession[]
    sessionsLoaded: boolean
    fetchSessions: () => Promise<void>
    revokeSession: (id: string) => Promise<boolean>

    updateName: (name: string) => Promise<boolean>
    loginDev: (email: string, name?: string) => Promise<boolean>
    logout: () => Promise<void>
    endImpersonation: () => Promise<boolean>
    acceptConsent: () => Promise<boolean>
    exportAccount: () => Promise<void>
    deleteAccount: () => Promise<boolean>
}

export const createAuthSlice: StateCreator<AppStore, [], [], AuthSlice> = (set, get) => ({
    me: null,
    permissions: [],
    resourceLimits: NO_RESOURCE_LIMITS,
    slots: NO_SLOTS,
    roleName: null,
    impersonatedBy: null,
    paid: false,
    upgradePlanName: null,
    authLoaded: false,
    authConfig: null,
    identities: [],
    identitiesLoaded: false,
    sessions: [],
    sessionsLoaded: false,

    async fetchAuth() {
        setForbiddenHandler(() => void get().refreshSession())
        const skipProbe =
            window.location.pathname === '/login' && !readFromStorage<boolean>(SESSION_HINT, false)

        const [authConfig, session] = await Promise.all([
            AuthService.getInstance().config().catch(() => null),
            skipProbe
                ? Promise.resolve(null)
                : AuthService.getInstance().me().catch(() => null),
        ])
        if (session) writeToStorage(SESSION_HINT, true)
        else if (!skipProbe && navigator.onLine) removeFromStorage(SESSION_HINT)
        set({
            authConfig,
            me: session?.user ?? null,
            permissions: session?.permissions ?? [],
            resourceLimits: session?.resourceLimits ?? NO_RESOURCE_LIMITS,
            slots: session?.slots ?? NO_SLOTS,
            roleName: session?.roleName ?? null,
            paid: session?.paid ?? false,
            impersonatedBy: session?.impersonatedBy ?? null,
            upgradePlanName: session?.upgradePlanName ?? null,
            authLoaded: true,
        })
    },

    async refreshSession() {
        const session = await AuthService.getInstance().me().catch(() => null)

        if (!session) return
        set({
            me: session.user,
            permissions: session.permissions,
            resourceLimits: session.resourceLimits ?? NO_RESOURCE_LIMITS,
            slots: session.slots,
            roleName: session.roleName ?? null,
            impersonatedBy: session.impersonatedBy ?? null,
            paid: session.paid,
            upgradePlanName: session.upgradePlanName,
        })
    },

    async endImpersonation() {
        try {
            await AuthService.getInstance().endImpersonation()
            await get().refreshSession()
            window.location.assign('/admin')
            return true
        } catch (error) {
            fail(get, error, STRINGS.common.loadFailed)
            return false
        }
    },

    async fetchIdentities() {
        try {
            const identities = await AccountService.getInstance().listIdentities()
            set({ identities, identitiesLoaded: true })
        } catch {
            set({ identitiesLoaded: true })
        }
    },

    async unlinkIdentity(provider) {
        try {
            await AccountService.getInstance().unlinkIdentity(provider)
            set({ identities: get().identities.filter((identity) => identity.provider !== provider) })
            get().addAlert({
                variant: 'success',
                message: STRINGS.alerts.identityUnlinked(OAUTH_PROVIDER_LABELS[provider]),
                dismissible: true,
            })
            return true
        } catch (error) {
            fail(get, error, STRINGS.alerts.identityUnlinkFailed)
            return false
        }
    },

    async fetchSessions() {
        try {
            const sessions = await AccountService.getInstance().listSessions()
            set({ sessions, sessionsLoaded: true })
        } catch {
            set({ sessionsLoaded: true })
        }
    },

    async revokeSession(id) {
        try {
            await AccountService.getInstance().revokeSession(id)
            set({ sessions: get().sessions.filter((session) => session.id !== id) })
            get().addAlert({ variant: 'success', message: STRINGS.alerts.sessionRevoked, dismissible: true })
            return true
        } catch (error) {
            fail(get, error, STRINGS.alerts.sessionRevokeFailed)
            return false
        }
    },

    async updateName(name) {
        try {
            const me = await AccountService.getInstance().updateName(name)

            set({ me })
            get().addAlert({ variant: 'success', message: STRINGS.alerts.nameSaved, dismissible: true })
            return true
        } catch (error) {
            fail(get, error, STRINGS.alerts.nameFailed)
            return false
        }
    },

    async loginDev(email, name) {
        try {
            const me = await AuthService.getInstance().loginDev(email, name)
            writeToStorage(SESSION_HINT, true)
            set({ me })

            await get().refreshSession()
            return true
        } catch (error) {
            fail(get, error, STRINGS.alerts.loginFailed)
            return false
        }
    },

    async logout() {
        try {
            await AuthService.getInstance().logout()
        } finally {
            removeFromStorage(SESSION_HINT)

            window.location.href = '/'
        }
    },

    async acceptConsent() {
        try {
            const me = await AccountService.getInstance().acceptConsent()
            set({ me })
            void get().refreshSession()
            return true
        } catch (error) {
            fail(get, error, STRINGS.alerts.consentFailed)
            return false
        }
    },

    async exportAccount() {
        try {
            const data = await AccountService.getInstance().exportData()
            downloadTextFile(`account-export-${get().me?.id ?? 'account'}.json`, JSON.stringify(data, null, 2), 'application/json')
        } catch (error) {
            fail(get, error, STRINGS.alerts.accountExportFailed)
        }
    },

    async deleteAccount() {
        try {
            await AccountService.getInstance().deleteAccount()
            removeFromStorage(SESSION_HINT)

            window.location.href = '/'
            return true
        } catch (error) {
            fail(get, error, STRINGS.alerts.accountDeleteFailed)
            return false
        }
    },
})
