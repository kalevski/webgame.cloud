import { StateCreator } from 'zustand'
import ProjectService from 'services/ProjectService'
import { STRINGS } from 'configs/strings'
import { readFromStorage, writeToStorage } from 'helpers/storage'
import {
    AdminProject,
    AdminProjectFilters,
    InviteDraft,
    LimitUsage,
    Project,
    ProjectDraft,
    ProjectInvite,
    ProjectLock,
    ProjectMember,
    ProjectPermission,
    ProjectCategoriesAndTags,
    CategoriesAndTagsDraft,
} from 'types'
import type { AppStore } from './index'

const ACTIVE_KEY = 'activeProjectId'

export type ProjectsSlice = {
    projects: Project[]
    projectsLoaded: boolean

    activeProjectId: string | null

    members: ProjectMember[]
    invites: ProjectInvite[]
    myInvites: ProjectInvite[]
    categoriesAndTags: ProjectCategoriesAndTags | null
    projectUsage: Record<string, LimitUsage[]>
    lock: ProjectLock | null

    adminProjects: AdminProject[]
    adminProjectsTotal: number
    adminProjectsLoading: boolean
    adminProjectFilters: AdminProjectFilters
    adminProject: AdminProject | null

    activeProject: () => Project | null

    setActiveProject: (id: string | null) => void
    fetchProjects: (archived?: boolean) => Promise<void>
    createProject: (draft: ProjectDraft) => Promise<Project | null>
    updateProject: (id: string, patch: Partial<ProjectDraft> & { defaultCategoryId?: string | null }) => Promise<boolean>
    archiveProject: (id: string, archived: boolean) => Promise<boolean>
    transferProject: (id: string, userId: string) => Promise<boolean>
    deleteProject: (id: string) => Promise<boolean>

    fetchCategoriesAndTags: (id: string) => Promise<void>
    saveCategoriesAndTags: (id: string, draft: CategoriesAndTagsDraft) => Promise<boolean>

    fetchMembers: (id: string) => Promise<void>
    updateMemberPermissions: (id: string, memberId: string, permissions: ProjectPermission[]) => Promise<boolean>
    updateInvitePermissions: (id: string, inviteId: string, permissions: ProjectPermission[]) => Promise<boolean>
    removeMember: (id: string, memberId: string) => Promise<boolean>
    leaveProject: (id: string) => Promise<boolean>

    fetchInvites: (id: string) => Promise<void>
    sendInvite: (id: string, draft: InviteDraft) => Promise<boolean>
    revokeInvite: (id: string, inviteId: string) => Promise<boolean>

    fetchMyInvites: () => Promise<void>
    acceptInvite: (inviteId: string) => Promise<boolean>
    declineInvite: (inviteId: string) => Promise<boolean>

    fetchProjectUsage: (id: string) => Promise<void>

    fetchAdminProjects: (patch?: Partial<AdminProjectFilters>) => Promise<void>
    fetchAdminProject: (id: string) => Promise<void>
    clearAdminProject: () => void

    pollLock: (id: string) => void
    stopLockPoll: () => void
}

let lockTimer: ReturnType<typeof setInterval> | null = null

const fail = (get: () => AppStore, error: unknown, fallback: string) =>
    get().addAlert({
        variant: 'danger',
        message: error instanceof Error ? error.message : fallback,
        dismissible: true,
    })

export const ADMIN_PROJECT_PAGE_SIZE = 20

const ADMIN_PROJECT_DEFAULTS: AdminProjectFilters = {
    q: '',
    appType: undefined,
    realmId: '',
    state: 'active',
    sort: 'created',
    direction: 'desc',
    limit: ADMIN_PROJECT_PAGE_SIZE,
    offset: 0,
}

export const resolveActiveProject = (projects: Project[], stored: string | null): string | null => {
    if (projects.length === 0) return null
    if (stored && projects.some((project) => project.id === stored)) return stored
    return projects[0].id
}

export const createProjectsSlice: StateCreator<AppStore, [], [], ProjectsSlice> = (set, get) => ({
    projects: [],
    projectsLoaded: false,
    activeProjectId: readFromStorage<string | null>(ACTIVE_KEY, null),
    members: [],
    invites: [],
    myInvites: [],
    categoriesAndTags: null,
    projectUsage: {},
    lock: null,

    adminProjects: [],
    adminProjectsTotal: 0,
    adminProjectsLoading: false,
    adminProjectFilters: ADMIN_PROJECT_DEFAULTS,
    adminProject: null,

    activeProject() {
        const { projects, activeProjectId } = get()
        return projects.find((project) => project.id === activeProjectId) ?? null
    },

    setActiveProject(id) {
        get().stopLockPoll()
        set({ activeProjectId: id, lock: null, members: [], invites: [], categoriesAndTags: null })
        writeToStorage(ACTIVE_KEY, id)
    },

    async fetchProjects(archived = false) {
        try {
            const projects = await ProjectService.getInstance().list(archived)
            const resolved = resolveActiveProject(projects, get().activeProjectId)
            set({ projects, projectsLoaded: true, activeProjectId: resolved })
            writeToStorage(ACTIVE_KEY, resolved)
        } catch (error) {
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async createProject(draft) {
        try {
            const created = await ProjectService.getInstance().create(draft)
            await get().fetchProjects()
            get().setActiveProject(created.id)
            void get().refreshSession()
            get().addAlert({ variant: 'success', message: STRINGS.projects.created, dismissible: true })
            return created
        } catch (error) {
            fail(get, error, STRINGS.projects.saveFailed)
            return null
        }
    },

    async updateProject(id, patch) {
        try {
            const updated = await ProjectService.getInstance().update(id, patch)
            set({ projects: get().projects.map((project) => (project.id === id ? updated : project)) })
            return true
        } catch (error) {
            fail(get, error, STRINGS.projects.saveFailed)
            return false
        }
    },

    async archiveProject(id, archived) {
        try {
            await ProjectService.getInstance().archive(id, archived)
            await get().fetchProjects()
            return true
        } catch (error) {
            fail(get, error, STRINGS.projects.saveFailed)
            return false
        }
    },

    async transferProject(id, userId) {
        try {
            await ProjectService.getInstance().transfer(id, userId)
            await get().fetchProjects()
            void get().refreshSession()
            return true
        } catch (error) {
            fail(get, error, STRINGS.projects.saveFailed)
            return false
        }
    },

    async deleteProject(id) {
        try {
            await ProjectService.getInstance().remove(id)
            if (get().activeProjectId === id) get().setActiveProject(null)
            await get().fetchProjects()
            void get().refreshSession()
            return true
        } catch (error) {
            fail(get, error, STRINGS.projects.saveFailed)
            return false
        }
    },

    async fetchCategoriesAndTags(id) {
        try {
            set({ categoriesAndTags: await ProjectService.getInstance().categoriesAndTags(id) })
        } catch (error) {
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async saveCategoriesAndTags(id, draft) {
        try {
            set({ categoriesAndTags: await ProjectService.getInstance().saveCategoriesAndTags(id, draft) })
            return true
        } catch (error) {
            fail(get, error, STRINGS.projects.saveFailed)
            return false
        }
    },

    async fetchMembers(id) {
        try {
            set({ members: await ProjectService.getInstance().members(id) })
        } catch (error) {
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async updateInvitePermissions(id, inviteId, permissions) {
        try {
            const invite = await ProjectService.getInstance().setInvitePermissions(id, inviteId, permissions)
            set({ invites: get().invites.map((entry) => (entry.id === inviteId ? invite : entry)) })
            return true
        } catch (error) {
            fail(get, error, STRINGS.projects.saveFailed)
            return false
        }
    },

    async updateMemberPermissions(id, memberId, permissions) {
        try {
            const member = await ProjectService.getInstance().setMemberPermissions(id, memberId, permissions)
            set({ members: get().members.map((entry) => (entry.id === memberId ? member : entry)) })
            return true
        } catch (error) {
            fail(get, error, STRINGS.projects.saveFailed)
            return false
        }
    },

    async removeMember(id, memberId) {
        try {
            await ProjectService.getInstance().removeMember(id, memberId)
            set({ members: get().members.filter((entry) => entry.id !== memberId) })
            void get().fetchProjectUsage(id)
            return true
        } catch (error) {
            fail(get, error, STRINGS.projects.saveFailed)
            return false
        }
    },

    async leaveProject(id) {
        try {
            await ProjectService.getInstance().leave(id)
            if (get().activeProjectId === id) get().setActiveProject(null)
            await get().fetchProjects()
            return true
        } catch (error) {
            fail(get, error, STRINGS.projects.saveFailed)
            return false
        }
    },

    async fetchInvites(id) {
        try {
            set({ invites: await ProjectService.getInstance().invites(id) })
        } catch (error) {
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async sendInvite(id, draft) {
        try {
            await ProjectService.getInstance().invite(id, draft)
            await get().fetchInvites(id)
            void get().fetchProjectUsage(id)
            return true
        } catch (error) {
            fail(get, error, STRINGS.projects.saveFailed)
            return false
        }
    },

    async revokeInvite(id, inviteId) {
        try {
            await ProjectService.getInstance().revokeInvite(id, inviteId)
            set({ invites: get().invites.filter((invite) => invite.id !== inviteId) })
            void get().fetchProjectUsage(id)
            return true
        } catch (error) {
            fail(get, error, STRINGS.projects.saveFailed)
            return false
        }
    },

    async fetchMyInvites() {
        try {
            set({ myInvites: await ProjectService.getInstance().myInvites() })
        } catch (error) {
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async acceptInvite(inviteId) {
        try {
            const project = await ProjectService.getInstance().acceptInvite(inviteId)
            await get().fetchProjects()
            get().setActiveProject(project.id)
            set({ myInvites: get().myInvites.filter((invite) => invite.id !== inviteId) })
            return true
        } catch (error) {
            fail(get, error, STRINGS.projects.saveFailed)
            return false
        }
    },

    async declineInvite(inviteId) {
        try {
            await ProjectService.getInstance().declineInvite(inviteId)
            set({ myInvites: get().myInvites.filter((invite) => invite.id !== inviteId) })
            return true
        } catch (error) {
            fail(get, error, STRINGS.projects.saveFailed)
            return false
        }
    },

    async fetchProjectUsage(id) {
        try {
            const usage = await ProjectService.getInstance().usage(id)
            set({ projectUsage: { ...get().projectUsage, [id]: usage } })
        } catch {
            return
        }
    },

    pollLock(id) {
        get().stopLockPoll()
        const read = async () => {
            try {
                const lock = await ProjectService.getInstance().lock(id)
                set({ lock })
                if (!lock.locked) get().stopLockPoll()
            } catch {
                get().stopLockPoll()
            }
        }
        void read()
        lockTimer = setInterval(read, 5000)
    },

    stopLockPoll() {
        if (lockTimer) clearInterval(lockTimer)
        lockTimer = null
    },

    async fetchAdminProjects(patch = {}) {
        const filters = { ...get().adminProjectFilters, ...patch }
        set({ adminProjectFilters: filters, adminProjectsLoading: true })
        try {
            const page = await ProjectService.getInstance().listAdmin(filters)
            set({
                adminProjects: page.projects,
                adminProjectsTotal: page.total,
                adminProjectsLoading: false,
            })
        } catch (error) {
            set({ adminProjectsLoading: false })
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async fetchAdminProject(id) {
        try {
            set({ adminProject: await ProjectService.getInstance().getAdmin(id) })
        } catch (error) {
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    clearAdminProject() {
        set({ adminProject: null })
    },
})
