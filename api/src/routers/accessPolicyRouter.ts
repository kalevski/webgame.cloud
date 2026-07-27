import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import type {
    AccessPolicy,
    Role,
    RoleBindings,
    RoleDraft,
    UserAccessOverrides,
    UserAccessPayload,
} from '../contracts/index.js'
import { LIMITABLE_RESOURCES, PERMISSIONS, ROLE_SLOTS, encodeErrorCause } from '../contracts/index.js'
import { requireAuth, requirePermission } from '../auth.js'
import container from '../container.js'
import { AccessPolicyService } from '../services/AccessPolicyService.js'
import { UserService } from '../services/UserService.js'
import { recordAudit } from '../audit.js'
import { sendError } from './sendError.js'

const access = () => container.resolve(AccessPolicyService)
const users = () => container.resolve(UserService)

const permissionDeltaSchema = {
    type: 'object',
    additionalProperties: false,
    properties: Object.fromEntries(PERMISSIONS.map((key) => [key, { type: 'boolean' }])),
} as const

const limitMapSchema = {
    type: 'object',
    additionalProperties: false,
    properties: Object.fromEntries(
        LIMITABLE_RESOURCES.map((key) => [key, { type: ['integer', 'null'], minimum: 0, maximum: 1_000_000 }])
    ),
} as const

const roleLimitsSchema = {
    type: 'object',
    additionalProperties: limitMapSchema,
} as const

const roleDraftSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['name', 'permissions'],
    properties: {
        id: { type: 'string', minLength: 1, maxLength: 60 },
        name: { type: 'string', minLength: 1, maxLength: 80 },
        permissions: { type: 'array', maxItems: 200, items: { type: 'string', enum: [...PERMISSIONS] } },
    },
} as const

const bindingsSchema = {
    type: 'object',
    additionalProperties: false,
    properties: Object.fromEntries(
        ROLE_SLOTS.map((slot) => [slot, { type: ['string', 'null'], maxLength: 60 }])
    ),
} as const

const userAccessSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['permissions', 'limits'],
    properties: { permissions: permissionDeltaSchema, limits: limitMapSchema },
} as const

const reassignSchema = {
    type: 'object',
    required: ['toRoleId'],
    additionalProperties: false,
    properties: { toRoleId: { type: 'string', minLength: 1, maxLength: 60 } },
} as const

const limitsBodySchema = {
    type: 'object',
    required: ['roleLimits'],
    additionalProperties: false,
    properties: { roleLimits: roleLimitsSchema },
} as const

const listRolesEndpoint = async (): Promise<Role[]> => access().listRoles()

const createRoleEndpoint = async (request: FastifyRequest<{ Body: RoleDraft }>, reply: FastifyReply) => {
    try {
        const role = await access().saveRole(request.body)
        void recordAudit(request.user!, 'create_role', role.id, `${role.name} · ${role.permissions.length} permissions`)
        reply.code(201)
        return role
    } catch (error) {
        return sendError(reply, error)
    }
}

const updateRoleEndpoint = async (
    request: FastifyRequest<{ Params: { roleId: string }; Body: RoleDraft }>,
    reply: FastifyReply
) => {
    try {
        const role = await access().saveRole(request.body, request.params.roleId)
        void recordAudit(request.user!, 'update_role', role.id, `${role.name} · ${role.permissions.length} permissions`)
        return role
    } catch (error) {
        return sendError(reply, error)
    }
}

const deleteRoleEndpoint = async (
    request: FastifyRequest<{ Params: { roleId: string } }>,
    reply: FastifyReply
) => {
    try {
        await access().deleteRole(request.params.roleId)
        void recordAudit(request.user!, 'delete_role', request.params.roleId, '')
        reply.code(204)
        return null
    } catch (error) {
        return sendError(reply, error)
    }
}

const reassignRoleEndpoint = async (
    request: FastifyRequest<{ Params: { roleId: string }; Body: { toRoleId: string } }>,
    reply: FastifyReply
) => {
    try {
        const moved = await access().reassignRole(request.params.roleId, request.body.toRoleId)
        void recordAudit(
            request.user!,
            'reassign_role',
            request.params.roleId,
            `${moved} accounts → ${request.body.toRoleId}`
        )
        return { moved }
    } catch (error) {
        return sendError(reply, error)
    }
}

const getPolicyEndpoint = async (): Promise<AccessPolicy> => access().getPolicy()

const saveLimitsEndpoint = async (
    request: FastifyRequest<{ Body: { roleLimits: AccessPolicy['roleLimits'] } }>,
    reply: FastifyReply
) => {
    try {
        const saved = await access().saveLimits(request.body.roleLimits)
        void recordAudit(request.user!, 'update_role_limits', '', `roles=${Object.keys(saved.roleLimits).length}`)
        return saved
    } catch (error) {
        return sendError(reply, error)
    }
}

const saveBindingsEndpoint = async (
    request: FastifyRequest<{ Body: Partial<RoleBindings> }>,
    reply: FastifyReply
) => {
    try {
        const saved = await access().saveBindings(request.body)
        void recordAudit(
            request.user!,
            'update_role_bindings',
            '',
            ROLE_SLOTS.map((slot) => `${slot}=${saved[slot] ?? '—'}`).join(' ')
        )
        return saved
    } catch (error) {
        return sendError(reply, error)
    }
}

const getUserAccessEndpoint = async (
    request: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply
): Promise<UserAccessPayload | { error: string }> => {
    const target = await users().findById(request.params.userId)
    if (!target) {
        reply.code(404)
        return { error: encodeErrorCause('user_not_found', request.params.userId) }
    }
    const overrides = await access().getUserOverrides(target.id)
    return { ...overrides, usage: await access().usageFor(target) }
}

const saveUserAccessEndpoint = async (
    request: FastifyRequest<{ Params: { userId: string }; Body: UserAccessOverrides }>,
    reply: FastifyReply
) => {
    const target = await users().findById(request.params.userId)
    if (!target) {
        reply.code(404)
        return { error: encodeErrorCause('user_not_found', request.params.userId) }
    }

    if (target.id === request.user!.id) {
        reply.code(400)
        return { error: encodeErrorCause('self_access_change') }
    }
    try {
        const saved = await access().saveUserOverrides(target.id, request.body)
        void recordAudit(
            request.user!,
            'update_user_access',
            target.id,
            `permissions=${Object.keys(saved.permissions).length} limits=${Object.keys(saved.limits).length}`
        )
        return { ...saved, usage: await access().usageFor(target) }
    } catch (error) {
        return sendError(reply, error)
    }
}

export const accessPolicyRouter: FastifyPluginAsync = async (app) => {
    app.addHook('preHandler', requireAuth)

    app.get(
        '/api/roles',
        { preHandler: [requirePermission('admin.role.read')] },
        listRolesEndpoint
    )

    app.post<{ Body: RoleDraft }>(
        '/api/roles',
        { schema: { body: roleDraftSchema }, preHandler: [requirePermission('admin.role.write')] },
        createRoleEndpoint
    )

    app.put<{ Params: { roleId: string }; Body: RoleDraft }>(
        '/api/roles/:roleId',
        { schema: { body: roleDraftSchema }, preHandler: [requirePermission('admin.role.write')] },
        updateRoleEndpoint
    )

    app.delete<{ Params: { roleId: string } }>(
        '/api/roles/:roleId',
        { preHandler: [requirePermission('admin.role.write')] },
        deleteRoleEndpoint
    )

    app.post<{ Params: { roleId: string }; Body: { toRoleId: string } }>(
        '/api/roles/:roleId/reassign',
        { schema: { body: reassignSchema }, preHandler: [requirePermission('admin.user.role.write')] },
        reassignRoleEndpoint
    )

    app.get(
        '/api/access-policy',
        { preHandler: [requirePermission('admin.role.read')] },
        getPolicyEndpoint
    )

    app.put<{ Body: { roleLimits: AccessPolicy['roleLimits'] } }>(
        '/api/access-policy/limits',
        { schema: { body: limitsBodySchema }, preHandler: [requirePermission('admin.role.write')] },
        saveLimitsEndpoint
    )

    app.put<{ Body: Partial<RoleBindings> }>(
        '/api/access-policy/bindings',
        { schema: { body: bindingsSchema }, preHandler: [requirePermission('admin.role.write')] },
        saveBindingsEndpoint
    )

    app.get<{ Params: { userId: string } }>(
        '/api/users/:userId/access',
        { preHandler: [requirePermission('admin.user.role.write')] },
        getUserAccessEndpoint
    )

    app.put<{ Params: { userId: string }; Body: UserAccessOverrides }>(
        '/api/users/:userId/access',
        { schema: { body: userAccessSchema }, preHandler: [requirePermission('admin.user.role.write')] },
        saveUserAccessEndpoint
    )

}
