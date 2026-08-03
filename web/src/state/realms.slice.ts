import { StateCreator } from 'zustand'
import RealmService from 'services/RealmService'
import ProjectService from 'services/ProjectService'
import { STRINGS } from 'configs/strings'
import {
    AdminProject,
    AdminProjectFilters,
    Realm,
    RealmDraft,
    RealmRegion,
    RealmRegionDraft,
    RealmSamplePoint,
    RealmStats,
    RealmToken,
} from 'types'
import type { AppStore } from './index'

export type RealmsSlice = {
    realms: Realm[]
    realmsLoaded: boolean

    realmRegions: RealmRegion[]
    realmRegionsLoaded: boolean

    realmDetail: Realm | null
    realmStats: RealmStats | null
    realmSamples: RealmSamplePoint[]
    realmDetailLoaded: boolean

    realmProjects: AdminProject[]
    realmProjectsTotal: number
    realmProjectsLoading: boolean
    realmProjectFilters: AdminProjectFilters

    fetchRealms: () => Promise<void>
    fetchRealmRegions: () => Promise<void>
    createRealmRegion: (draft: RealmRegionDraft) => Promise<boolean>
    updateRealmRegion: (id: string, draft: Partial<RealmRegionDraft>) => Promise<boolean>
    deleteRealmRegion: (id: string) => Promise<boolean>
    fetchRealmDetail: (id: string) => Promise<void>
    clearRealmDetail: () => void
    fetchRealmProjects: (realmId: string, patch?: Partial<AdminProjectFilters>) => Promise<void>
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

    realmRegions: [],
    realmRegionsLoaded: false,

    realmDetail: null,
    realmStats: null,
    realmSamples: [],
    realmDetailLoaded: false,

    realmProjects: [],
    realmProjectsTotal: 0,
    realmProjectsLoading: false,
    realmProjectFilters: {},

    async fetchRealms() {
        try {
            set({ realms: await RealmService.getInstance().list(), realmsLoaded: true })
        } catch (error) {
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async fetchRealmRegions() {
        try {
            set({
                realmRegions: await RealmService.getInstance().listRegions(),
                realmRegionsLoaded: true,
            })
        } catch (error) {
            set({ realmRegionsLoaded: true })
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async createRealmRegion(draft) {
        try {
            await RealmService.getInstance().createRegion(draft)
            await get().fetchRealmRegions()
            return true
        } catch (error) {
            fail(get, error, STRINGS.realms.regionSaveFailed)
            return false
        }
    },

    async updateRealmRegion(id, draft) {
        try {
            const region = await RealmService.getInstance().updateRegion(id, draft)
            set({
                realmRegions: get().realmRegions.map((entry) => (entry.id === id ? region : entry)),
            })
            return true
        } catch (error) {
            fail(get, error, STRINGS.realms.regionSaveFailed)
            return false
        }
    },

    async deleteRealmRegion(id) {
        try {
            await RealmService.getInstance().removeRegion(id)
            set({ realmRegions: get().realmRegions.filter((entry) => entry.id !== id) })
            return true
        } catch (error) {
            fail(get, error, STRINGS.realms.regionSaveFailed)
            return false
        }
    },

    async fetchRealmDetail(id) {
        try {
            const [realm, stats, samples] = await Promise.all([
                RealmService.getInstance().find(id),
                RealmService.getInstance().stats(id),
                RealmService.getInstance().samples(id),
            ])
            set({ realmDetail: realm, realmStats: stats, realmSamples: samples, realmDetailLoaded: true })
        } catch (error) {
            set({ realmDetailLoaded: true })
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    clearRealmDetail() {
        set({
            realmDetail: null,
            realmStats: null,
            realmSamples: [],
            realmDetailLoaded: false,
            realmProjects: [],
            realmProjectsTotal: 0,
            realmProjectFilters: {},
        })
    },

    async fetchRealmProjects(realmId, patch = {}) {
        const filters = { ...get().realmProjectFilters, ...patch, realmId }
        set({ realmProjectFilters: filters, realmProjectsLoading: true })
        try {
            const page = await ProjectService.getInstance().listAdmin(filters)
            set({
                realmProjects: page.projects,
                realmProjectsTotal: page.total,
                realmProjectsLoading: false,
            })
        } catch (error) {
            set({ realmProjectsLoading: false })
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
