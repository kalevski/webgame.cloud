import type { FastifyReply, FastifyRequest } from 'fastify'
import type { ProjectPermission } from './contracts/index.js'
import { encodeErrorCause } from './contracts/index.js'
import container from './container.js'
import { resolveProjectPermissions } from './domain/projectAccess.js'
import { ProjectRepository } from './repositories/projects/ProjectRepository.js'
import { MemberRepository } from './repositories/projects/MemberRepository.js'
import { ProjectMigrationRepository } from './repositories/realms/ProjectMigrationRepository.js'
import type { ProjectRow } from './schema/projects.js'

declare module 'fastify' {
    interface FastifyRequest {
        project: ProjectRow | null

        readonly projectPermissions: ReadonlySet<ProjectPermission>

        resolvedProjectPermissions: ReadonlySet<ProjectPermission> | null

        canInProject(permission: ProjectPermission): boolean
    }
}

const EMPTY: ReadonlySet<ProjectPermission> = new Set()

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

const projectIdOf = (request: FastifyRequest): string =>
    (request.params as { id?: string }).id ?? ''

export const loadProject = async (request: FastifyRequest, reply: FastifyReply) => {
    request.resolvedProjectPermissions = EMPTY

    if (!request.user) {
        reply.code(401).send({ error: encodeErrorCause('unauthorized') })
        return reply
    }

    if (request.apiKeyAuth) {
        reply.code(403).send({ error: encodeErrorCause('forbidden') })
        return reply
    }

    const id = projectIdOf(request)
    const project = await container.resolve(ProjectRepository).findById(id)
    if (!project) {
        reply.code(404).send({ error: encodeErrorCause('project_not_found') })
        return reply
    }

    const membership = await container.resolve(MemberRepository).findMembership(project.id, request.user.id)
    const permissions = resolveProjectPermissions(
        request.user,
        { ownerId: project.owner_id },
        membership ?? null
    )

    if (!membership && project.owner_id !== request.user.id && permissions.size === 0) {
        reply.code(404).send({ error: encodeErrorCause('project_not_found') })
        return reply
    }

    request.project = project
    request.resolvedProjectPermissions = permissions
}

export const requireProjectMember = async (request: FastifyRequest, reply: FastifyReply) => {
    const outcome = await loadProject(request, reply)
    if (outcome) return outcome

    if (!MUTATING.has(request.method)) return

    const project = request.project!

    if (project.archived_at) {
        reply.code(409).send({ error: encodeErrorCause('project_archived') })
        return reply
    }

    const migration = await container.resolve(ProjectMigrationRepository).findActive(project.id)
    if (migration) {
        reply.code(423).send({ error: encodeErrorCause('project_locked') })
        return reply
    }
}

export const requireProjectPermission = (...permissions: ProjectPermission[]) =>
    async (request: FastifyRequest, reply: FastifyReply) => {
        const outcome = await requireProjectMember(request, reply)
        if (outcome) return outcome

        if (!permissions.every((permission) => request.canInProject(permission))) {
            reply.code(403).send({ error: encodeErrorCause('forbidden') })
            return reply
        }
    }

export const requireProjectOwner = async (request: FastifyRequest, reply: FastifyReply) => {
    const outcome = await requireProjectMember(request, reply)
    if (outcome) return outcome

    if (request.project!.owner_id !== request.user!.id) {
        reply.code(403).send({ error: encodeErrorCause('not_project_owner') })
        return reply
    }
}

export const registerProjectAuth = (app: import('fastify').FastifyInstance): void => {
    app.decorateRequest('project', null)
    app.decorateRequest('resolvedProjectPermissions', null)
    app.decorateRequest('projectPermissions', {
        getter(this: FastifyRequest): ReadonlySet<ProjectPermission> {
            return this.resolvedProjectPermissions ?? EMPTY
        },
    })
    app.decorateRequest('canInProject', function (this: FastifyRequest, permission: ProjectPermission): boolean {
        return this.projectPermissions.has(permission)
    })
}
