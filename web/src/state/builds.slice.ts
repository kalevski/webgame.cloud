import { StateCreator } from 'zustand'
import BuildService from 'services/BuildService'
import { STRINGS } from 'configs/strings'
import { Build, BuildDetail, BuildFilters } from 'types'
import type { AppStore } from './index'

export type BuildsSlice = {
    builds: Build[]
    buildsLoaded: boolean
    buildFilters: BuildFilters
    buildDetail: BuildDetail | null

    fetchBuilds: (projectId: string) => Promise<void>
    fetchBuild: (projectId: string, buildId: string) => Promise<void>
    setBuildFilters: (filters: BuildFilters) => void
    runBuild: (projectId: string, bundleId: string) => Promise<boolean>
    setBuildTag: (projectId: string, buildId: string, buildTag: string) => Promise<boolean>
    deleteBuild: (projectId: string, buildId: string) => Promise<boolean>
    purgeBuilds: (projectId: string) => Promise<number>
}

const fail = (get: () => AppStore, error: unknown, fallback: string) =>
    get().addAlert({
        variant: 'danger',
        message: error instanceof Error ? error.message : fallback,
        dismissible: true,
    })

export const createBuildsSlice: StateCreator<AppStore, [], [], BuildsSlice> = (set, get) => ({
    builds: [],
    buildsLoaded: false,
    buildFilters: {},
    buildDetail: null,

    async fetchBuilds(projectId) {
        try {
            set({
                builds: await BuildService.getInstance().list(projectId, get().buildFilters),
                buildsLoaded: true,
            })
        } catch (error) {
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async fetchBuild(projectId, buildId) {
        try {
            set({ buildDetail: await BuildService.getInstance().detail(projectId, buildId) })
        } catch (error) {
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    setBuildFilters(filters) {
        set({ buildFilters: filters })
    },

    async runBuild(projectId, bundleId) {
        try {
            await BuildService.getInstance().run(projectId, bundleId)
            await get().fetchBuilds(projectId)
            return true
        } catch (error) {
            fail(get, error, STRINGS.common.saveFailed)
            return false
        }
    },

    async setBuildTag(projectId, buildId, buildTag) {
        try {
            await BuildService.getInstance().setTag(projectId, buildId, buildTag)
            await get().fetchBuilds(projectId)
            return true
        } catch (error) {
            fail(get, error, STRINGS.common.saveFailed)
            return false
        }
    },

    async deleteBuild(projectId, buildId) {
        try {
            await BuildService.getInstance().remove(projectId, buildId)
            set({ builds: get().builds.filter((build) => build.id !== buildId) })
            return true
        } catch (error) {
            fail(get, error, STRINGS.common.saveFailed)
            return false
        }
    },

    async purgeBuilds(projectId) {
        try {
            const { purged } = await BuildService.getInstance().purge(projectId)
            await get().fetchBuilds(projectId)
            return purged
        } catch (error) {
            fail(get, error, STRINGS.common.saveFailed)
            return 0
        }
    },
})
