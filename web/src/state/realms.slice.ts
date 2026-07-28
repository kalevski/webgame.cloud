import { StateCreator } from 'zustand'
import RealmService from 'services/RealmService'
import { STRINGS } from 'configs/strings'
import { Realm, RealmDraft, RealmToken } from 'types'
import type { AppStore } from './index'

export type RealmsSlice = {
    realms: Realm[]
    realmsLoaded: boolean

    fetchRealms: () => Promise<void>
    createRealm: (draft: RealmDraft) => Promise<RealmToken | null>
    updateRealm: (id: string, draft: Partial<RealmDraft>) => Promise<boolean>
    deleteRealm: (id: string) => Promise<boolean>
    rotateRealmToken: (id: string) => Promise<RealmToken | null>
    moveProjectToRealm: (projectId: string, realmId: string) => Promise<boolean>
}

const fail = (get: () => AppStore, error: unknown, fallback: string) =>
    get().addAlert({
        variant: 'danger',
        message: error instanceof Error ? error.message : fallback,
        dismissible: true,
    })

export const createRealmsSlice: StateCreator<AppStore, [], [], RealmsSlice> = (set, get) => ({
    realms: [],
    realmsLoaded: false,

    async fetchRealms() {
        try {
            set({ realms: await RealmService.getInstance().list(), realmsLoaded: true })
        } catch (error) {
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async createRealm(draft) {
        try {
            const issued = await RealmService.getInstance().create(draft)
            await get().fetchRealms()
            return issued
        } catch (error) {
            fail(get, error, STRINGS.realms.saveFailed)
            return null
        }
    },

    async updateRealm(id, draft) {
        try {
            const realm = await RealmService.getInstance().update(id, draft)
            set({ realms: get().realms.map((entry) => (entry.id === id ? realm : entry)) })
            return true
        } catch (error) {
            fail(get, error, STRINGS.realms.saveFailed)
            return false
        }
    },

    async deleteRealm(id) {
        try {
            await RealmService.getInstance().remove(id)
            set({ realms: get().realms.filter((entry) => entry.id !== id) })
            return true
        } catch (error) {
            fail(get, error, STRINGS.realms.saveFailed)
            return false
        }
    },

    async rotateRealmToken(id) {
        try {
            return await RealmService.getInstance().rotateToken(id)
        } catch (error) {
            fail(get, error, STRINGS.realms.saveFailed)
            return null
        }
    },

    async moveProjectToRealm(projectId, realmId) {
        try {
            await RealmService.getInstance().moveProject(projectId, realmId)
            get().addAlert({ variant: 'success', message: STRINGS.realms.moveStarted, dismissible: true })
            return true
        } catch (error) {
            fail(get, error, STRINGS.realms.saveFailed)
            return false
        }
    },
})
