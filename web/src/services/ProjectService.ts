import { apiFetch } from 'helpers/api'
import { Project, ProjectDraft, Task, TaskStatus } from 'types'

class ProjectService {
    private static instance: ProjectService
    private constructor() {}

    static getInstance(): ProjectService {
        if (!ProjectService.instance) ProjectService.instance = new ProjectService()
        return ProjectService.instance
    }

    async list(): Promise<Project[]> {
        return apiFetch<Project[]>('/api/projects')
    }

    async create(draft: ProjectDraft): Promise<Project> {
        return apiFetch<Project>('/api/projects', { method: 'POST', body: JSON.stringify(draft) })
    }

    async update(id: string, patch: Partial<ProjectDraft>): Promise<Project> {
        return apiFetch<Project>(`/api/projects/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            body: JSON.stringify(patch),
        })
    }

    async remove(id: string): Promise<void> {
        await apiFetch<void>(`/api/projects/${encodeURIComponent(id)}`, { method: 'DELETE' })
    }

    async listTasks(projectId: string): Promise<Task[]> {
        return apiFetch<Task[]>(`/api/projects/${encodeURIComponent(projectId)}/tasks`)
    }

    async addTask(projectId: string, title: string, status?: TaskStatus): Promise<Task> {
        return apiFetch<Task>(`/api/projects/${encodeURIComponent(projectId)}/tasks`, {
            method: 'POST',
            body: JSON.stringify({ title, status }),
        })
    }

    async updateTask(id: string, patch: { title?: string; status?: TaskStatus }): Promise<Task> {
        return apiFetch<Task>(`/api/tasks/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            body: JSON.stringify(patch),
        })
    }

    async removeTask(id: string): Promise<void> {
        await apiFetch<void>(`/api/tasks/${encodeURIComponent(id)}`, { method: 'DELETE' })
    }

    async exportProject(id: string): Promise<{ project: Project; tasks: Task[] }> {
        return apiFetch(`/api/projects/${encodeURIComponent(id)}/export`)
    }
}

export default ProjectService
