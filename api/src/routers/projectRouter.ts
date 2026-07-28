import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import type {
    InviteDraft,
    ProjectDraft,
    ProjectPermission,
    VocabulariesDraft,
} from '../contracts/index.js'
import { APP_TYPES, PROJECT_PERMISSIONS, encodeErrorCause } from '../contracts/index.js'
import { requireAuth, requirePermission } from '../auth.js'
import {
    loadProject,
    requireProjectMember,
    requireProjectOwner,
    requireProjectPermission,
} from '../projectAuth.js'
import container from '../container.js'
import { ProjectService } from '../services/ProjectService.js'
import { AccessPolicyService } from '../services/AccessPolicyService.js'
import { RealmService } from '../services/RealmService.js'
import { sendError } from './sendError.js'
import { recordAudit } from '../audit.js'

const projects = () => container.resolve(ProjectService)
const access = () => container.resolve(AccessPolicyService)
const realms = () => container.resolve(RealmService)

const projectSchema = {
    type: 'object',
    required: ['name'],
    additionalProperties: false,
    properties: {
        name: { type: 'string', minLength: 1, maxLength: 200 },
        description: { type: 'string', maxLength: 4000 },
        appType: { type: 'string', enum: [...APP_TYPES] },
        icon: { type: 'string', minLength: 1, maxLength: 100 },
        color: { type: 'string', maxLength: 20 },
        categories: { type: 'array', maxItems: 50, items: { type: 'string', minLength: 1, maxLength: 80 } },
        tags: { type: 'array', maxItems: 200, items: { type: 'string', minLength: 1, maxLength: 80 } },
        buildTags: { type: 'array', maxItems: 50, items: { type: 'string', minLength: 1, maxLength: 80 } },
        defaultCategoryId: { type: ['string', 'null'], maxLength: 80 },
    },
} as const

const vocabularySchema = {
    type: 'object',
    required: ['categories', 'tags', 'buildTags'],
    additionalProperties: false,
    properties: {
        categories: { type: 'array', maxItems: 50, items: { type: 'string', minLength: 1, maxLength: 80 } },
        tags: { type: 'array', maxItems: 200, items: { type: 'string', minLength: 1, maxLength: 80 } },
        buildTags: { type: 'array', maxItems: 50, items: { type: 'string', minLength: 1, maxLength: 80 } },
        defaultCategoryId: { type: ['string', 'null'], maxLength: 80 },
    },
} as const

const permissionsSchema = {
    type: 'object',
    required: ['permissions'],
    additionalProperties: false,
    properties: {
        permissions: {
            type: 'array',
            items: { type: 'string', enum: [...PROJECT_PERMISSIONS] },
            maxItems: PROJECT_PERMISSIONS.length,
        },
    },
} as const

const inviteSchema = {
    type: 'object',
    required: ['permissions'],
    additionalProperties: false,
    properties: {
        email: { type: 'string', maxLength: 320 },
        username: { type: 'string', maxLength: 320 },
        permissions: {
            type: 'array',
            items: { type: 'string', enum: [...PROJECT_PERMISSIONS] },
            maxItems: PROJECT_PERMISSIONS.length,
        },
    },
} as const

const archiveSchema = {
    type: 'object',
    required: ['archived'],
    additionalProperties: false,
    properties: { archived: { type: 'boolean' } },
} as const

const transferSchema = {
    type: 'object',
    required: ['userId'],
    additionalProperties: false,
    properties: { userId: { type: 'string', minLength: 1, maxLength: 80 } },
} as const

const listProjectsEndpoint = async (
    request: FastifyRequest<{ Querystring: { archived?: string } }>
) => projects().list(request.user!, request.query.archived === 'true')

const createProjectEndpoint = async (
    request: FastifyRequest<{ Body: ProjectDraft }>,
    reply: FastifyReply
) => {
    try {
        const created = await projects().create(request.user!, request.body)
        void recordAudit(request.user!, 'project.created', created.id, created.name, request.id)
        reply.code(201)
        return created
    } catch (error) {
        return sendError(reply, error)
    }
}

const getProjectEndpoint = async (request: FastifyRequest) =>
    projects().get(request.project!, request.user!)

const patchProjectEndpoint = async (
    request: FastifyRequest<{ Body: Partial<ProjectDraft> & { defaultCategoryId?: string | null } }>,
    reply: FastifyReply
) => {
    try {
        const updated = await projects().update(request.project!, request.user!, request.body)
        void recordAudit(request.user!, 'project.updated', updated.id, updated.name, request.id)
        return updated
    } catch (error) {
        return sendError(reply, error)
    }
}

const archiveProjectEndpoint = async (
    request: FastifyRequest<{ Body: { archived: boolean } }>,
    reply: FastifyReply
) => {
    try {
        const updated = await projects().setArchived(request.project!, request.user!, request.body.archived)
        void recordAudit(request.user!, 'project.archived', updated.id, String(request.body.archived), request.id)
        return updated
    } catch (error) {
        return sendError(reply, error)
    }
}

const transferProjectEndpoint = async (
    request: FastifyRequest<{ Body: { userId: string } }>,
    reply: FastifyReply
) => {
    try {
        await projects().transferOwnership(request.project!, request.body.userId)
        void recordAudit(request.user!, 'project.transferred', request.project!.id, request.body.userId, request.id)
        reply.code(204)
        return null
    } catch (error) {
        return sendError(reply, error)
    }
}

const deleteProjectEndpoint = async (request: FastifyRequest, reply: FastifyReply) => {
    const project = request.project!
    if (project.owner_id !== request.user!.id) {
        reply.code(403)
        return { error: encodeErrorCause('not_project_owner') }
    }
    const deleted = await projects().remove(project)
    if (!deleted) {
        reply.code(404)
        return { error: encodeErrorCause('project_not_found') }
    }
    void recordAudit(request.user!, 'project.deleted', project.id, project.name, request.id)
    return { deleted: true }
}

const projectUsageEndpoint = async (request: FastifyRequest) =>
    access().projectUsageFor({ id: request.project!.id, ownerId: request.project!.owner_id })

const projectLockEndpoint = async (request: FastifyRequest) =>
    realms().lockOf(request.project!.id)

const listVocabulariesEndpoint = async (request: FastifyRequest) =>
    projects().vocabularies(request.project!.id)

const putVocabulariesEndpoint = async (
    request: FastifyRequest<{ Body: VocabulariesDraft }>,
    reply: FastifyReply
) => {
    try {
        return await projects().replaceVocabularies(request.project!, request.body)
    } catch (error) {
        return sendError(reply, error)
    }
}

const listMembersEndpoint = async (request: FastifyRequest) =>
    projects().listMembers(request.project!.id, request.project!.owner_id)

const patchMemberEndpoint = async (
    request: FastifyRequest<{ Params: { id: string; memberId: string }; Body: { permissions: ProjectPermission[] } }>,
    reply: FastifyReply
) => {
    try {
        const member = await projects().setMemberPermissions(
            request.project!,
            request.user!,
            request.projectPermissions,
            request.params.memberId,
            request.body.permissions
        )
        void recordAudit(
            request.user!,
            'member.permissions_changed',
            member.userId,
            request.project!.id,
            request.id
        )
        return member
    } catch (error) {
        return sendError(reply, error)
    }
}

const deleteMemberEndpoint = async (
    request: FastifyRequest<{ Params: { id: string; memberId: string } }>,
    reply: FastifyReply
) => {
    try {
        await projects().removeMember(request.project!, request.params.memberId)
        void recordAudit(request.user!, 'member.removed', request.params.memberId, request.project!.id, request.id)
        reply.code(204)
        return null
    } catch (error) {
        return sendError(reply, error)
    }
}

const leaveProjectEndpoint = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        await projects().leave(request.project!, request.user!)
        void recordAudit(request.user!, 'member.left', request.user!.id, request.project!.id, request.id)
        reply.code(204)
        return null
    } catch (error) {
        return sendError(reply, error)
    }
}

const listInvitesEndpoint = async (request: FastifyRequest) =>
    projects().listInvites(request.project!.id)

const createInviteEndpoint = async (
    request: FastifyRequest<{ Body: InviteDraft }>,
    reply: FastifyReply
) => {
    try {
        const created = await projects().invite(
            request.user!,
            request.project!,
            request.projectPermissions,
            request.body
        )
        if (created.isErr()) {
            reply.code(409)
            return { error: encodeErrorCause('invite_exists') }
        }
        const invite = created.unwrap()
        void recordAudit(request.user!, 'member.invited', invite.id, invite.email, request.id)
        reply.code(201)
        return invite
    } catch (error) {
        return sendError(reply, error)
    }
}

const revokeInviteEndpoint = async (
    request: FastifyRequest<{ Params: { id: string; inviteId: string } }>,
    reply: FastifyReply
) => {
    try {
        await projects().revokeInvite(request.project!, request.params.inviteId)
        void recordAudit(request.user!, 'invite.revoked', request.params.inviteId, request.project!.id, request.id)
        reply.code(204)
        return null
    } catch (error) {
        return sendError(reply, error)
    }
}

export const projectRouter: FastifyPluginAsync = async (app) => {
    app.addHook('preHandler', requireAuth)

    app.get<{ Querystring: { archived?: string } }>('/api/projects', listProjectsEndpoint)

    app.post<{ Body: ProjectDraft }>(
        '/api/projects',
        { schema: { body: projectSchema }, preHandler: [requirePermission('project.create')] },
        createProjectEndpoint
    )

    app.get<{ Params: { id: string } }>(
        '/api/projects/:id',
        { preHandler: [loadProject] },
        getProjectEndpoint
    )

    app.patch<{ Params: { id: string }; Body: Partial<ProjectDraft> }>(
        '/api/projects/:id',
        {
            schema: { body: { ...projectSchema, required: [] } },
            preHandler: [requireProjectPermission('project.settings')],
        },
        patchProjectEndpoint
    )

    app.post<{ Params: { id: string }; Body: { archived: boolean } }>(
        '/api/projects/:id/archive',
        { schema: { body: archiveSchema }, preHandler: [loadProject] },
        async (request, reply) => {
            if (request.project!.owner_id !== request.user!.id) {
                reply.code(403)
                return { error: encodeErrorCause('not_project_owner') }
            }
            return archiveProjectEndpoint(request, reply)
        }
    )

    app.post<{ Params: { id: string }; Body: { userId: string } }>(
        '/api/projects/:id/transfer',
        { schema: { body: transferSchema }, preHandler: [requireProjectOwner] },
        transferProjectEndpoint
    )

    app.delete<{ Params: { id: string } }>(
        '/api/projects/:id',
        { preHandler: [requireProjectOwner] },
        deleteProjectEndpoint
    )

    app.get<{ Params: { id: string } }>(
        '/api/projects/:id/usage',
        { preHandler: [loadProject] },
        projectUsageEndpoint
    )

    app.get<{ Params: { id: string } }>(
        '/api/projects/:id/lock',
        { preHandler: [loadProject] },
        projectLockEndpoint
    )

    app.get<{ Params: { id: string } }>(
        '/api/projects/:id/vocabularies',
        { preHandler: [loadProject] },
        listVocabulariesEndpoint
    )

    app.put<{ Params: { id: string }; Body: VocabulariesDraft }>(
        '/api/projects/:id/vocabularies',
        {
            schema: { body: vocabularySchema },
            preHandler: [requireProjectPermission('project.settings')],
        },
        putVocabulariesEndpoint
    )

    app.get<{ Params: { id: string } }>(
        '/api/projects/:id/members',
        { preHandler: [loadProject] },
        listMembersEndpoint
    )

    app.patch<{ Params: { id: string; memberId: string }; Body: { permissions: ProjectPermission[] } }>(
        '/api/projects/:id/members/:memberId',
        {
            schema: { body: permissionsSchema },
            preHandler: [requireProjectPermission('member.manage')],
        },
        patchMemberEndpoint
    )

    app.delete<{ Params: { id: string } }>(
        '/api/projects/:id/members/me',
        { preHandler: [requireProjectMember] },
        leaveProjectEndpoint
    )

    app.delete<{ Params: { id: string; memberId: string } }>(
        '/api/projects/:id/members/:memberId',
        { preHandler: [requireProjectPermission('member.manage')] },
        deleteMemberEndpoint
    )

    app.get<{ Params: { id: string } }>(
        '/api/projects/:id/invites',
        { preHandler: [loadProject] },
        listInvitesEndpoint
    )

    app.post<{ Params: { id: string }; Body: InviteDraft }>(
        '/api/projects/:id/invites',
        {
            schema: { body: inviteSchema },
            preHandler: [requireProjectPermission('member.manage')],
        },
        createInviteEndpoint
    )

    app.delete<{ Params: { id: string; inviteId: string } }>(
        '/api/projects/:id/invites/:inviteId',
        { preHandler: [requireProjectPermission('member.manage')] },
        revokeInviteEndpoint
    )
}
