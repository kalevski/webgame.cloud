import { StateCreator } from 'zustand'
import RoleApplicationService from 'services/RoleApplicationService'
import { STRINGS } from 'configs/strings'
import { OpenRole, RoleApplication, RoleApplicationDraft, RoleApplicationFilters } from 'types'
import type { AppStore } from './index'
import { fail } from './alerts.slice'

export type RoleApplicationsSlice = {
    openRoles: OpenRole[]
    myApplications: RoleApplication[]
    myApplicationsLoaded: boolean

    fetchMyRoleApplications: () => Promise<void>
    applyForRole: (draft: RoleApplicationDraft) => Promise<RoleApplication | null>
    withdrawRoleApplication: (applicationId: string) => Promise<boolean>

    roleApplications: RoleApplication[]
    roleApplicationsTotal: number
    roleApplicationsLoading: boolean
    roleApplicationFilters: RoleApplicationFilters

    fetchRoleApplications: (filters?: RoleApplicationFilters) => Promise<void>
    decideRoleApplication: (applicationId: string, approve: boolean, note: string) => Promise<boolean>
}

export const createRoleApplicationsSlice: StateCreator<AppStore, [], [], RoleApplicationsSlice> = (set, get) => ({
    openRoles: [],
    myApplications: [],
    myApplicationsLoaded: false,

    roleApplications: [],
    roleApplicationsTotal: 0,
    roleApplicationsLoading: false,
    roleApplicationFilters: { status: 'pending', limit: 25, offset: 0 },

    async fetchMyRoleApplications() {
        try {
            const [openRoles, myApplications] = await Promise.all([
                RoleApplicationService.getInstance().openRoles(),
                RoleApplicationService.getInstance().mine(),
            ])
            set({ openRoles, myApplications, myApplicationsLoaded: true })
        } catch (error) {
            set({ myApplicationsLoaded: true })
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async applyForRole(draft) {
        try {
            const application = await RoleApplicationService.getInstance().apply(draft)
            await get().fetchMyRoleApplications()
            get().addAlert({ variant: 'success', message: STRINGS.roleApplications.sent, dismissible: true })
            return application
        } catch (error) {
            fail(get, error, STRINGS.roleApplications.sendFailed)
            return null
        }
    },

    async withdrawRoleApplication(applicationId) {
        try {
            await RoleApplicationService.getInstance().withdraw(applicationId)
            await get().fetchMyRoleApplications()
            get().addAlert({ variant: 'success', message: STRINGS.roleApplications.withdrawn, dismissible: true })
            return true
        } catch (error) {
            fail(get, error, STRINGS.roleApplications.sendFailed)
            return false
        }
    },

    async fetchRoleApplications(filters) {
        const next = { ...get().roleApplicationFilters, ...filters }
        set({ roleApplicationsLoading: true, roleApplicationFilters: next })
        try {
            const { applications, total } = await RoleApplicationService.getInstance().list(next)
            set({ roleApplications: applications, roleApplicationsTotal: total, roleApplicationsLoading: false })
        } catch (error) {
            set({ roleApplicationsLoading: false })
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async decideRoleApplication(applicationId, approve, note) {
        try {
            await RoleApplicationService.getInstance().decide(applicationId, { approve, note })
            await get().fetchRoleApplications()
            get().addAlert({
                variant: 'success',
                message: approve ? STRINGS.roleApplications.approved : STRINGS.roleApplications.rejected,
                dismissible: true,
            })
            return true
        } catch (error) {
            fail(get, error, STRINGS.roleApplications.decideFailed)
            return false
        }
    },
})
