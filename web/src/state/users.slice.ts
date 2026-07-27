import { StateCreator } from 'zustand'
import UserService from 'services/UserService'
import { STRINGS } from 'configs/strings'
import { AdminOverview, PlatformSettings, User, UserRole } from 'types'
import type { AppStore } from './index'

export type UsersSlice = {
    users: User[]
    usersLoaded: boolean
    settings: PlatformSettings | null
    overview: AdminOverview | null
    fetchUsers: () => Promise<void>
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

    async fetchUsers() {
        try {
            set({ users: await UserService.getInstance().fetchUsers(), usersLoaded: true })
        } catch (error) {
            get().addAlert({
                variant: 'danger',
                message: error instanceof Error ? error.message : STRINGS.common.loadFailed,
                dismissible: true,
            })
        }
    },

    async createUser(draft) {
        try {
            const created = await UserService.getInstance().createUser(draft)
            await get().fetchUsers()
            get().addAlert({ variant: 'success', message: STRINGS.usersAdmin.userCreated, dismissible: true })
            return created
        } catch (error) {
            get().addAlert({
                variant: 'danger',
                message: error instanceof Error ? error.message : STRINGS.usersAdmin.saveFailed,
                dismissible: true,
            })
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
            get().addAlert({
                variant: 'danger',
                message: error instanceof Error ? error.message : STRINGS.usersAdmin.saveFailed,
                dismissible: true,
            })
            return null
        }
    },

    async impersonateUser(id) {
        try {
            await UserService.getInstance().impersonateUser(id)

            window.location.href = '/dashboard'
        } catch (error) {
            get().addAlert({
                variant: 'danger',
                message: error instanceof Error ? error.message : STRINGS.usersAdmin.saveFailed,
                dismissible: true,
            })
        }
    },

    async fetchSettings() {
        try {
            set({ settings: await UserService.getInstance().fetchSettings() })
        } catch (error) {
            get().addAlert({
                variant: 'danger',
                message: error instanceof Error ? error.message : STRINGS.common.loadFailed,
                dismissible: true,
            })
        }
    },

    async saveSettings(next) {
        try {
            set({ settings: await UserService.getInstance().updateSettings(next) })
            get().addAlert({ variant: 'success', message: STRINGS.platformSettings.saved, dismissible: true })
            return true
        } catch (error) {
            get().addAlert({
                variant: 'danger',
                message: error instanceof Error ? error.message : STRINGS.platformSettings.saveFailed,
                dismissible: true,
            })
            return false
        }
    },

    async fetchOverview() {
        try {
            set({ overview: await UserService.getInstance().fetchOverview() })
        } catch (error) {
            get().addAlert({
                variant: 'danger',
                message: error instanceof Error ? error.message : STRINGS.common.loadFailed,
                dismissible: true,
            })
        }
    },
})
