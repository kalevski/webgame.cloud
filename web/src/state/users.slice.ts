import { StateCreator } from 'zustand'
import UserService from 'services/UserService'
import { STRINGS } from 'configs/strings'
import { AdminOverview, AdminUserProfile, PlatformSettings, User, UserRole } from 'types'
import type { AppStore } from './index'
import { fail } from './alerts.slice'

export type UsersSlice = {
    users: User[]
    usersLoaded: boolean
    settings: PlatformSettings | null
    overview: AdminOverview | null
    userProfile: AdminUserProfile | null
    userProfileLoading: boolean
    fetchUsers: () => Promise<void>
    fetchUserProfile: (id: string) => Promise<void>
    clearUserProfile: () => void
    createUser: (draft: { email: string; name?: string; role?: UserRole }) => Promise<User | null>
    updateUser: (id: string, patch: { role?: UserRole; active?: boolean; verified?: boolean }) => Promise<User | null>
    impersonateUser: (id: string) => Promise<void>
    fetchSettings: () => Promise<void>
    saveSettings: (next: PlatformSettings) => Promise<boolean>
    fetchOverview: () => Promise<void>
}

export const createUsersSlice: StateCreator<AppStore, [], [], UsersSlice> = (set, get) => ({
    users: [],
    usersLoaded: false,
    settings: null,
    overview: null,
    userProfile: null,
    userProfileLoading: false,

    async fetchUserProfile(id) {
        set({ userProfileLoading: true })
        try {
            set({ userProfile: await UserService.getInstance().fetchProfile(id), userProfileLoading: false })
        } catch (error) {
            set({ userProfileLoading: false })
            get().addAlert({
                variant: 'danger',
                message: error instanceof Error ? error.message : STRINGS.common.loadFailed,
                dismissible: true,
            })
        }
    },

    clearUserProfile() {
        set({ userProfile: null })
    },

    async fetchUsers() {
        try {
            set({ users: await UserService.getInstance().fetchUsers(), usersLoaded: true })
        } catch (error) {
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async createUser(draft) {
        try {
            const created = await UserService.getInstance().createUser(draft)
            await get().fetchUsers()
            get().addAlert({ variant: 'success', message: STRINGS.usersAdmin.userCreated, dismissible: true })
            return created
        } catch (error) {
            fail(get, error, STRINGS.usersAdmin.saveFailed)
            return null
        }
    },

    async updateUser(id, patch) {
        try {
            const updated = await UserService.getInstance().updateUser(id, patch)

            set({ users: get().users.map((user) => (user.id === id ? updated : user)) })
            get().addAlert({ variant: 'success', message: STRINGS.usersAdmin.saved, dismissible: true })
            return updated
        } catch (error) {
            fail(get, error, STRINGS.usersAdmin.saveFailed)
            return null
        }
    },

    async impersonateUser(id) {
        try {
            await UserService.getInstance().impersonateUser(id)

            window.location.href = '/'
        } catch (error) {
            fail(get, error, STRINGS.usersAdmin.saveFailed)
        }
    },

    async fetchSettings() {
        try {
            set({ settings: await UserService.getInstance().fetchSettings() })
        } catch (error) {
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async saveSettings(next) {
        try {
            set({ settings: await UserService.getInstance().updateSettings(next) })
            get().addAlert({ variant: 'success', message: STRINGS.platformSettings.saved, dismissible: true })
            return true
        } catch (error) {
            fail(get, error, STRINGS.platformSettings.saveFailed)
            return false
        }
    },

    async fetchOverview() {
        try {
            set({ overview: await UserService.getInstance().fetchOverview() })
        } catch (error) {
            fail(get, error, STRINGS.common.loadFailed)
        }
    },
})
