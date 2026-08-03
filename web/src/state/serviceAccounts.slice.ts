import { StateCreator } from 'zustand'
import ServiceAccountService from 'services/ServiceAccountService'
import { STRINGS } from 'configs/strings'
import {
    ApiKey,
    ApiKeyDraft,
    ApiKeyIssued,
    ServiceAccount,
    ServiceAccountDraft,
    UserAccessOverrides,
    UserAccessPayload,
    UserRole,
} from 'types'
import type { AppStore } from './index'

const fail = (get: () => AppStore, error: unknown, fallback: string) =>
    get().addAlert({
        variant: 'danger',
        message: error instanceof Error ? error.message : fallback,
        dismissible: true,
    })

export type ServiceAccountsSlice = {
    serviceAccounts: ServiceAccount[]
    serviceAccountsLoaded: boolean
    serviceKeys: ApiKey[]
    serviceKeysOwnerId: string | null
    fetchServiceAccounts: () => Promise<void>
    createServiceAccount: (draft: ServiceAccountDraft) => Promise<ServiceAccount | null>
    updateServiceAccount: (
        id: string,
        patch: { name?: string; role?: UserRole; active?: boolean }
    ) => Promise<ServiceAccount | null>
    deleteServiceAccount: (id: string) => Promise<boolean>
    fetchServiceAccountAccess: (id: string) => Promise<UserAccessPayload | null>
    saveServiceAccountAccess: (id: string, overrides: UserAccessOverrides) => Promise<boolean>
    fetchServiceKeys: (id: string) => Promise<void>
    createServiceKey: (id: string, draft: ApiKeyDraft) => Promise<ApiKeyIssued | null>
    revokeServiceKey: (id: string, keyId: string) => Promise<boolean>
    clearServiceKeys: () => void
}

export const createServiceAccountsSlice: StateCreator<AppStore, [], [], ServiceAccountsSlice> = (set, get) => ({
    serviceAccounts: [],
    serviceAccountsLoaded: false,
    serviceKeys: [],
    serviceKeysOwnerId: null,

    async fetchServiceAccounts() {
        try {
            const serviceAccounts = await ServiceAccountService.getInstance().list()
            set({ serviceAccounts, serviceAccountsLoaded: true })
        } catch (error) {
            set({ serviceAccountsLoaded: true })
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async createServiceAccount(draft) {
        try {
            const created = await ServiceAccountService.getInstance().create(draft)
            await get().fetchServiceAccounts()
            get().addAlert({ variant: 'success', message: STRINGS.serviceAccounts.created, dismissible: true })
            return created
        } catch (error) {
            fail(get, error, STRINGS.serviceAccounts.saveFailed)
            return null
        }
    },

    async updateServiceAccount(id, patch) {
        try {
            const updated = await ServiceAccountService.getInstance().update(id, patch)
            set({
                serviceAccounts: get().serviceAccounts.map((account) => (account.id === id ? updated : account)),
            })
            get().addAlert({ variant: 'success', message: STRINGS.serviceAccounts.saved, dismissible: true })
            return updated
        } catch (error) {
            fail(get, error, STRINGS.serviceAccounts.saveFailed)
            return null
        }
    },

    async deleteServiceAccount(id) {
        try {
            await ServiceAccountService.getInstance().remove(id)
            set({
                serviceAccounts: get().serviceAccounts.filter((account) => account.id !== id),
                serviceKeys: get().serviceKeysOwnerId === id ? [] : get().serviceKeys,
                serviceKeysOwnerId: get().serviceKeysOwnerId === id ? null : get().serviceKeysOwnerId,
            })
            get().addAlert({ variant: 'success', message: STRINGS.serviceAccounts.deleted, dismissible: true })
            return true
        } catch (error) {
            fail(get, error, STRINGS.serviceAccounts.saveFailed)
            return false
        }
    },

    async fetchServiceAccountAccess(id) {
        try {
            return await ServiceAccountService.getInstance().fetchAccess(id)
        } catch (error) {
            fail(get, error, STRINGS.common.loadFailed)
            return null
        }
    },

    async saveServiceAccountAccess(id, overrides) {
        try {
            await ServiceAccountService.getInstance().saveAccess(id, overrides)
            get().addAlert({ variant: 'success', message: STRINGS.accessAdmin.saved, dismissible: true })
            return true
        } catch (error) {
            fail(get, error, STRINGS.accessAdmin.saveFailed)
            return false
        }
    },

    async fetchServiceKeys(id) {
        try {
            const serviceKeys = await ServiceAccountService.getInstance().listKeys(id)
            set({ serviceKeys, serviceKeysOwnerId: id })
        } catch (error) {
            set({ serviceKeys: [], serviceKeysOwnerId: id })
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async createServiceKey(id, draft) {
        try {
            const issued = await ServiceAccountService.getInstance().createKey(id, draft)
            await get().fetchServiceKeys(id)
            await get().fetchServiceAccounts()
            get().addAlert({ variant: 'success', message: STRINGS.apiKeys.created, dismissible: true })
            return issued
        } catch (error) {
            fail(get, error, STRINGS.apiKeys.saveFailed)
            return null
        }
    },

    async revokeServiceKey(id, keyId) {
        try {
            await ServiceAccountService.getInstance().revokeKey(id, keyId)
            await get().fetchServiceKeys(id)
            await get().fetchServiceAccounts()
            get().addAlert({ variant: 'success', message: STRINGS.apiKeys.revoked, dismissible: true })
            return true
        } catch (error) {
            fail(get, error, STRINGS.apiKeys.saveFailed)
            return false
        }
    },

    clearServiceKeys() {
        set({ serviceKeys: [], serviceKeysOwnerId: null })
    },
})
