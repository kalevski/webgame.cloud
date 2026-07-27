import { StateCreator } from 'zustand'
import ProjectService from 'services/ProjectService'
import { STRINGS } from 'configs/strings'
import { Project, ProjectDraft, Task, TaskStatus } from 'types'
import type { AppStore } from './index'

export type ProjectsSlice = {
    projects: Project[]
    projectsLoaded: boolean

    tasksByProject: Record<string, Task[]>
    fetchProjects: () => Promise<void>
    createProject: (draft: ProjectDraft) => Promise<Project | null>
    updateProject: (id: string, patch: Partial<ProjectDraft>) => Promise<boolean>
    deleteProject: (id: string) => Promise<boolean>
    fetchTasks: (projectId: string) => Promise<void>
    addTask: (projectId: string, title: string, status?: TaskStatus) => Promise<boolean>
    moveTask: (projectId: string, task: Task, status: TaskStatus) => Promise<void>
    deleteTask: (projectId: string, taskId: string) => Promise<void>
    exportProject: (id: string) => Promise<void>
}

const fail = (get: () => AppStore, error: unknown, fallback: string) =>
    get().addAlert({
        variant: 'danger',
        message: error instanceof Error ? error.message : fallback,
        dismissible: true,
    })

export const createProjectsSlice: StateCreator<AppStore, [], [], ProjectsSlice> = (set, get) => ({
    projects: [],
    projectsLoaded: false,
    tasksByProject: {},

    async fetchProjects() {
        try {
            set({ projects: await ProjectService.getInstance().list(), projectsLoaded: true })
        } catch (error) {
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async createProject(draft) {
        try {
            const created = await ProjectService.getInstance().create(draft)
            await get().fetchProjects()

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
            get().addAlert({ variant: 'success', message: STRINGS.projects.saved, dismissible: true })
            return true
        } catch (error) {
            fail(get, error, STRINGS.projects.saveFailed)
            return false
        }
    },

    async deleteProject(id) {
        try {
            await ProjectService.getInstance().remove(id)
            set({ projects: get().projects.filter((project) => project.id !== id) })
            void get().refreshSession()
            get().addAlert({ variant: 'success', message: STRINGS.projects.deleted, dismissible: true })
            return true
        } catch (error) {
            fail(get, error, STRINGS.projects.saveFailed)
            return false
        }
    },

    async fetchTasks(projectId) {
        try {
            const tasks = await ProjectService.getInstance().listTasks(projectId)
            set({ tasksByProject: { ...get().tasksByProject, [projectId]: tasks } })
        } catch (error) {
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async addTask(projectId, title, status) {
        try {
            const task = await ProjectService.getInstance().addTask(projectId, title, status)
            const current = get().tasksByProject[projectId] ?? []
            set({ tasksByProject: { ...get().tasksByProject, [projectId]: [...current, task] } })

            set({ projects: get().projects.map((p) => (p.id === projectId ? { ...p, taskCount: p.taskCount + 1 } : p)) })
            void get().refreshSession()
            return true
        } catch (error) {
            fail(get, error, STRINGS.projects.saveFailed)
            return false
        }
    },

    async moveTask(projectId, task, status) {
        try {
            const updated = await ProjectService.getInstance().updateTask(task.id, { status })
            const current = get().tasksByProject[projectId] ?? []
            set({
                tasksByProject: {
                    ...get().tasksByProject,
                    [projectId]: current.map((entry) => (entry.id === task.id ? updated : entry)),
                },
            })
        } catch (error) {
            fail(get, error, STRINGS.projects.saveFailed)
        }
    },

    async deleteTask(projectId, taskId) {
        try {
            await ProjectService.getInstance().removeTask(taskId)
            const current = get().tasksByProject[projectId] ?? []
            set({ tasksByProject: { ...get().tasksByProject, [projectId]: current.filter((t) => t.id !== taskId) } })
            set({ projects: get().projects.map((p) => (p.id === projectId ? { ...p, taskCount: Math.max(0, p.taskCount - 1) } : p)) })
            void get().refreshSession()
        } catch (error) {
            fail(get, error, STRINGS.projects.saveFailed)
        }
    },

    async exportProject(id) {
        try {
            const data = await ProjectService.getInstance().exportProject(id)
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const anchor = document.createElement('a')
            anchor.href = url
            anchor.download = `project-${id}.json`
            anchor.click()
            URL.revokeObjectURL(url)
        } catch (error) {
            fail(get, error, STRINGS.projects.exportFailed)
        }
    },
})
