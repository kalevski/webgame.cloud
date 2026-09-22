import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import type {
    OpenRole,
    RoleApplication,
    RoleApplicationDecision,
    RoleApplicationDraft,
    RoleApplicationFilters,
} from '../contracts/index.js'
import { ROLE_APPLICATION_STATUSES } from '../contracts/index.js'
import { requireAuth, requirePermission } from '../auth.js'
import { rateLimit } from '../http/rateLimit.js'
import { recordRequestAudit } from '../audit.js'
import container from '../container.js'
import { RoleApplicationService } from '../services/RoleApplicationService.js'

const applications = () => container.resolve(RoleApplicationService)

const applicationDraftSchema = {
    type: 'object',
    required: ['roleId'],
    additionalProperties: false,
    properties: {
        roleId: { type: 'string', minLength: 1, maxLength: 60 },
        message: { type: 'string', maxLength: 2000 },
    },
} as const

const decisionSchema = {
    type: 'object',
    required: ['approve'],
    additionalProperties: false,
    properties: {
        approve: { type: 'boolean' },
        note: { type: 'string', maxLength: 2000 },
    },
} as const

const filtersSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        status: { type: 'string', enum: [...ROLE_APPLICATION_STATUSES] },
        roleId: { type: 'string', maxLength: 60 },
        q: { type: 'string', maxLength: 120 },
        limit: { type: 'integer', minimum: 1, maximum: 200 },
        offset: { type: 'integer', minimum: 0 },
    },
} as const

const openRolesEndpoint = async (request: FastifyRequest): Promise<OpenRole[]> =>
    applications().openRoles(request.user!)

const myApplicationsEndpoint = async (request: FastifyRequest): Promise<RoleApplication[]> =>
    applications().mine(request.user!.id)

const applyEndpoint = async (
    request: FastifyRequest<{ Body: RoleApplicationDraft }>,
    reply: FastifyReply
): Promise<RoleApplication> => {
    const created = await applications().apply(request.user!, request.body)
    void recordRequestAudit(request, 'create_role_application', created.id, created.roleId)
    reply.code(201)
    return created
}

const withdrawEndpoint = async (
    request: FastifyRequest<{ Params: { applicationId: string } }>,
    reply: FastifyReply
): Promise<RoleApplication> => {
    const updated = await applications().withdraw(request.user!, request.params.applicationId)
    void recordRequestAudit(request, 'withdraw_role_application', updated.id, updated.roleId)
    return updated
}

const listApplicationsEndpoint = async (
    request: FastifyRequest<{ Querystring: RoleApplicationFilters }>
): Promise<{ applications: RoleApplication[]; total: number }> => applications().list(request.query)

const decideEndpoint = async (
    request: FastifyRequest<{ Params: { applicationId: string }; Body: RoleApplicationDecision }>,
    reply: FastifyReply
): Promise<RoleApplication> => {
    const decided = await applications().decide(
        request.user!,
        request.params.applicationId,
        request.body
    )
    void recordRequestAudit(
        request,
        'decide_role_application',
        decided.id,
        `${decided.userEmail} → ${decided.roleId} · ${decided.status}`
    )
    return decided
}

export const roleApplicationRouter: FastifyPluginAsync = async (app) => {
    app.addHook('preHandler', requireAuth)

    app.get('/api/role-applications/open-roles', openRolesEndpoint)

    app.get('/api/role-applications/mine', myApplicationsEndpoint)

    app.post<{ Body: RoleApplicationDraft }>(
        '/api/role-applications',
        {
            schema: { body: applicationDraftSchema },
            preHandler: [rateLimit({ name: 'role_application', max: 5, windowSeconds: 3600 })],
        },
        applyEndpoint
    )

    app.post<{ Params: { applicationId: string } }>(
        '/api/role-applications/:applicationId/withdraw',
        {},
        withdrawEndpoint
    )

    app.get<{ Querystring: RoleApplicationFilters }>(
        '/api/role-applications',
        { schema: { querystring: filtersSchema }, preHandler: [requirePermission('role.application.read')] },
        listApplicationsEndpoint
    )

    app.post<{ Params: { applicationId: string }; Body: RoleApplicationDecision }>(
        '/api/role-applications/:applicationId/decision',
        { schema: { body: decisionSchema }, preHandler: [requirePermission('role.application.write')] },
        decideEndpoint
    )
}
