import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import type { Project, ProjectDraft, Task, TaskStatus, User } from '../contracts/index.js'
import { OWNER_ROLE_ID, encodeErrorCause } from '../contracts/index.js'
import { requireAuth, requirePermission } from '../auth.js'
import container from '../container.js'
import { ProjectService } from '../services/ProjectService.js'
import { UserService } from '../services/UserService.js'
import { sendError } from './sendError.js'
import { recordAudit } from '../audit.js'
import { notify } from '../notify.js'

const projects = () => container.resolve(ProjectService)
const users = () => container.resolve(UserService)

const STATUS_LABELS: Record<TaskStatus, string> = {
    planned: 'Planned',
    'in-progress': 'In Progress',
    shipped: 'Shipped',
}

const announceShared = async (actor: User, project: Project): Promise<void> => {
    const audience = await users().list()
    await Promise.all(
        audience
            .filter((entry) => entry.active && entry.id !== actor.id)
            .map((entry) =>
                notify(
                    entry.id,
                    'project_shared',
                    `${actor.name || actor.email} shared "${project.name}"`,
                    `/projects/${project.id}`
                )
            )
    )
}

const announceActivity = async (actor: User, project: Project, summary: string): Promise<void> => {
    if (!project.notifyOnActivity || project.ownerId === actor.id) return
    await notify(project.ownerId, 'task_activity', summary, `/projects/${project.id}`, { collapse: true })
}

const canEditProject = (user: User, project: Project): boolean =>
    user.role === OWNER_ROLE_ID || project.ownerId === user.id

const canEditTask = (user: User, task: Task): boolean =>
    user.role === OWNER_ROLE_ID || task.ownerId === user.id

const canViewProject = (user: User, project: Project): boolean =>
    canEditProject(user, project) || project.visibility === 'shared'

const projectSchema = {
    type: 'object',
    required: ['name'],
    additionalProperties: false,
    properties: {
        name: { type: 'string', minLength: 1, maxLength: 200 },
        description: { type: 'string', maxLength: 4000 },
        visibility: { type: 'string', enum: ['private', 'shared'] },
        icon: { type: 'string', minLength: 1, maxLength: 100 },
        color: { type: 'string', maxLength: 20 },
        priority: { type: 'integer', minimum: 1, maximum: 5 },
        dueDate: { type: ['string', 'null'], format: 'date' },
        notifyOnActivity: { type: 'boolean' },
    },
} as const

const taskSchema = {
    type: 'object',
    required: ['title'],
    additionalProperties: false,
    properties: {
        title: { type: 'string', minLength: 1, maxLength: 300 },
        status: { type: 'string', enum: ['planned', 'in-progress', 'shipped'] },
    },
} as const

const taskPatchSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        title: { type: 'string', minLength: 1, maxLength: 300 },
        status: { type: 'string', enum: ['planned', 'in-progress', 'shipped'] },
    },
} as const

const listProjectsEndpoint = async (request: FastifyRequest): Promise<Project[]> =>
    projects().listVisible(request.user!.id)

const createProjectEndpoint = async (request: FastifyRequest<{ Body: ProjectDraft }>, reply: FastifyReply) => {
    try {
        if (request.body.visibility === 'shared' && !request.can('project.share')) {
            reply.code(403)
            return { error: encodeErrorCause('forbidden') }
        }
        const project = await projects().create(request.user!, request.body)
        void recordAudit(request.user!, 'create_project', project.id, project.name)
        if (project.visibility === 'shared') void announceShared(request.user!, project)
        reply.code(201)
        return project
    } catch (error) {
        return sendError(reply, error)
    }
}

const getProjectEndpoint = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const project = await projects().get(request.params.id)
    if (!project || !canViewProject(request.user!, project)) {
        reply.code(404)
        return { error: encodeErrorCause('project_not_found', request.params.id) }
    }
    return project
}

const patchProjectEndpoint = async (
    request: FastifyRequest<{ Params: { id: string }; Body: Partial<ProjectDraft> }>,
    reply: FastifyReply
) => {
    try {
        const project = await projects().get(request.params.id)
        if (!project || !canViewProject(request.user!, project)) {
            reply.code(404)
            return { error: encodeErrorCause('project_not_found', request.params.id) }
        }
        if (!canEditProject(request.user!, project)) {
            reply.code(403)
            return { error: encodeErrorCause('forbidden') }
        }
        const nextVisibility = request.body.visibility ?? project.visibility
        if (nextVisibility === 'shared' && project.visibility !== 'shared' && !request.can('project.share')) {
            reply.code(403)
            return { error: encodeErrorCause('forbidden') }
        }
        const updated = await projects().update(request.params.id, {
            name: request.body.name ?? project.name,
            description: request.body.description ?? project.description,
            visibility: nextVisibility,
            icon: request.body.icon ?? project.icon,
            color: request.body.color ?? project.color,
            priority: request.body.priority ?? project.priority,
            dueDate: request.body.dueDate !== undefined ? request.body.dueDate : project.dueDate,
            notifyOnActivity: request.body.notifyOnActivity ?? project.notifyOnActivity,
        })
        if (nextVisibility === 'shared' && project.visibility !== 'shared') {
            void announceShared(request.user!, updated)
        }
        return updated
    } catch (error) {
        return sendError(reply, error)
    }
}

const deleteProjectEndpoint = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
        const project = await projects().get(request.params.id)
        if (!project || !canViewProject(request.user!, project)) {
            reply.code(404)
            return { error: encodeErrorCause('project_not_found', request.params.id) }
        }
        if (!canEditProject(request.user!, project)) {
            reply.code(403)
            return { error: encodeErrorCause('forbidden') }
        }
        await projects().remove(request.params.id)
        void recordAudit(request.user!, 'delete_project', request.params.id, project.name)
        reply.code(204)
        return null
    } catch (error) {
        return sendError(reply, error)
    }
}

const listTasksEndpoint = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
): Promise<Task[] | { error: string }> => {
    const project = await projects().get(request.params.id)
    if (!project || !canViewProject(request.user!, project)) {
        reply.code(404)
        return { error: encodeErrorCause('project_not_found', request.params.id) }
    }
    return projects().listTasks(request.params.id)
}

const createTaskEndpoint = async (
    request: FastifyRequest<{ Params: { id: string }; Body: { title: string; status?: TaskStatus } }>,
    reply: FastifyReply
) => {
    try {
        const project = await projects().get(request.params.id)
        if (!project || !canViewProject(request.user!, project)) {
            reply.code(404)
            return { error: encodeErrorCause('project_not_found', request.params.id) }
        }
        if (!canEditProject(request.user!, project)) {
            reply.code(403)
            return { error: encodeErrorCause('forbidden') }
        }
        const task = await projects().addTask(request.user!, project, request.body.title, request.body.status)
        void recordAudit(request.user!, 'create_task', task.id, `${project.name}: ${task.title}`)
        void announceActivity(
            request.user!,
            project,
            `${request.user!.name || request.user!.email} added "${task.title}" to ${project.name}`
        )
        reply.code(201)
        return task
    } catch (error) {
        return sendError(reply, error)
    }
}

const patchTaskEndpoint = async (
    request: FastifyRequest<{ Params: { id: string }; Body: { title?: string; status?: TaskStatus } }>,
    reply: FastifyReply
) => {
    try {
        const task = await projects().findTask(request.params.id)
        if (!task || !canEditTask(request.user!, task)) {
            reply.code(404)
            return { error: encodeErrorCause('task_not_found', request.params.id) }
        }
        const updated = await projects().updateTask(request.params.id, {
            title: request.body.title ?? task.title,
            status: request.body.status ?? task.status,
        })
        if (updated.status !== task.status) {
            const project = await projects().get(task.projectId)
            if (project) {
                void announceActivity(
                    request.user!,
                    project,
                    `${request.user!.name || request.user!.email} moved "${updated.title}" to ${STATUS_LABELS[updated.status]}`
                )
            }
        }
        return updated
    } catch (error) {
        return sendError(reply, error)
    }
}

const deleteTaskEndpoint = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
        const task = await projects().findTask(request.params.id)
        if (!task || !canEditTask(request.user!, task)) {
            reply.code(404)
            return { error: encodeErrorCause('task_not_found', request.params.id) }
        }
        await projects().removeTask(request.params.id)
        void recordAudit(request.user!, 'delete_task', request.params.id, task.title)
        reply.code(204)
        return null
    } catch (error) {
        return sendError(reply, error)
    }
}

const exportProjectEndpoint = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const result = await projects().exportProject(request.params.id)
    if (!result || !canViewProject(request.user!, result.project)) {
        reply.code(404)
        return { error: encodeErrorCause('project_not_found', request.params.id) }
    }
    void recordAudit(request.user!, 'export_project', result.project.id, result.project.name)
    return result
}

export const projectRouter: FastifyPluginAsync = async (app) => {
    app.addHook('preHandler', requireAuth)

    app.get('/api/projects', listProjectsEndpoint)

    app.post<{ Body: ProjectDraft }>(
        '/api/projects',
        { schema: { body: projectSchema }, preHandler: [requirePermission('project.write')] },
        createProjectEndpoint
    )

    app.get<{ Params: { id: string } }>('/api/projects/:id', getProjectEndpoint)

    app.patch<{ Params: { id: string }; Body: Partial<ProjectDraft> }>(
        '/api/projects/:id',
        { schema: { body: { ...projectSchema, required: [] } }, preHandler: [requirePermission('project.write')] },
        patchProjectEndpoint
    )

    app.delete<{ Params: { id: string } }>(
        '/api/projects/:id',
        { preHandler: [requirePermission('project.write')] },
        deleteProjectEndpoint
    )

    app.get<{ Params: { id: string } }>('/api/projects/:id/tasks', listTasksEndpoint)

    app.post<{ Params: { id: string }; Body: { title: string; status?: TaskStatus } }>(
        '/api/projects/:id/tasks',
        { schema: { body: taskSchema }, preHandler: [requirePermission('task.write')] },
        createTaskEndpoint
    )

    app.patch<{ Params: { id: string }; Body: { title?: string; status?: TaskStatus } }>(
        '/api/tasks/:id',
        { schema: { body: taskPatchSchema }, preHandler: [requirePermission('task.write')] },
        patchTaskEndpoint
    )

    app.delete<{ Params: { id: string } }>(
        '/api/tasks/:id',
        { preHandler: [requirePermission('task.write')] },
        deleteTaskEndpoint
    )

    app.get<{ Params: { id: string } }>(
        '/api/projects/:id/export',
        { preHandler: [requirePermission('project.export')] },
        exportProjectEndpoint
    )

}
