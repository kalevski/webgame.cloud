import { inject, injectable } from 'tsyringe'
import type { Project, ProjectDraft, ProjectVisibility, Task, TaskStatus, User } from '../contracts/index.js'
import { ProjectRepository } from '../repositories/projects/ProjectRepository.js'
import { TaskRepository } from '../repositories/projects/TaskRepository.js'
import { AccessPolicyService } from './AccessPolicyService.js'
import { NotFoundError, ValidationError } from '../domain/errors.js'
import type { ProjectRow, TaskRow } from '../schema/projects.js'

@injectable()
export class ProjectService {
    constructor(
        @inject(ProjectRepository) private projects: ProjectRepository,
        @inject(TaskRepository) private tasks: TaskRepository,
        @inject(AccessPolicyService) private access: AccessPolicyService
    ) {}

    private toProject(row: ProjectRow): Project {
        return {
            id: row.id,
            ownerId: row.owner_id,
            name: row.name,
            description: row.description,
            visibility: row.visibility,
            icon: row.icon,
            color: row.color,
            priority: row.priority,
            dueDate: row.due_date ? row.due_date.toISOString().slice(0, 10) : null,
            notifyOnActivity: row.notify_on_activity,
            taskCount: Number(row.task_count),
            createdAt: row.created_at.toISOString(),
            updatedAt: row.updated_at.toISOString(),
        }
    }

    private toTask(row: TaskRow): Task {
        return {
            id: row.id,
            projectId: row.project_id,
            ownerId: row.owner_id,
            title: row.title,
            status: row.status,
            position: row.position,
            createdAt: row.created_at.toISOString(),
        }
    }

    async listVisible(userId: string): Promise<Project[]> {
        const rows = await this.projects.listVisible(userId)
        return rows.map((row) => this.toProject(row))
    }

    async get(id: string): Promise<Project | null> {
        const row = await this.projects.findById(id)
        return row ? this.toProject(row) : null
    }

    async create(user: User, draft: ProjectDraft): Promise<Project> {
        if (!draft.name.trim()) throw new ValidationError('name_required', 'a project needs a name')
        await this.access.assertWithinLimit(user, 'projects')
        const row = await this.projects.create(user.id, draft)
        return this.toProject(row)
    }

    async update(
        id: string,
        patch: {
            name: string
            description: string
            visibility: ProjectVisibility
            icon: string
            color: string
            priority: number
            dueDate: string | null
            notifyOnActivity: boolean
        }
    ): Promise<Project> {
        const row = await this.projects.updateFields(id, patch)
        if (!row) throw new NotFoundError('project_not_found', `project ${id} not found`, [id])
        return this.toProject(row)
    }

    async remove(id: string): Promise<void> {
        const removed = await this.projects.remove(id)
        if (!removed) throw new NotFoundError('project_not_found', `project ${id} not found`, [id])
    }

    async listTasks(projectId: string): Promise<Task[]> {
        const rows = await this.tasks.listForProject(projectId)
        return rows.map((row) => this.toTask(row))
    }

    async addTask(user: User, project: Project, title: string, status: TaskStatus = 'planned'): Promise<Task> {
        if (!title.trim()) throw new ValidationError('title_required', 'a task needs a title')
        await this.access.assertWithinLimit(user, 'tasks')
        const row = await this.tasks.create(project.id, project.ownerId, title, status)
        return this.toTask(row)
    }

    async findTask(id: string): Promise<Task | null> {
        const row = await this.tasks.findById(id)
        return row ? this.toTask(row) : null
    }

    async updateTask(id: string, patch: { title: string; status: TaskStatus }): Promise<Task> {
        const row = await this.tasks.updateFields(id, patch)
        if (!row) throw new NotFoundError('task_not_found', `task ${id} not found`, [id])
        return this.toTask(row)
    }

    async removeTask(id: string): Promise<void> {
        const removed = await this.tasks.remove(id)
        if (!removed) throw new NotFoundError('task_not_found', `task ${id} not found`, [id])
    }

    async exportProject(id: string): Promise<{ project: Project; tasks: Task[] } | null> {
        const project = await this.get(id)
        if (!project) return null
        return { project, tasks: await this.listTasks(id) }
    }
}
