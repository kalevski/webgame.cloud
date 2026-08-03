import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import type {
    ApiKey,
    ApiKeyDraft,
    ApiKeyIssued,
    ServiceAccount,
    ServiceAccountDraft,
    UserAccessOverrides,
    UserAccessPayload,
    UserRole,
} from '../contracts/index.js'
import { LIMITABLE_RESOURCES, PERMISSIONS } from '../contracts/index.js'
import { requireAuth, requirePermission } from '../auth.js'
import container from '../container.js'
import { ServiceAccountService } from '../services/ServiceAccountService.js'
import { recordAudit } from '../audit.js'
import { sendError } from './sendError.js'

const accounts = () => container.resolve(ServiceAccountService)

const createSchema = {
    type: 'object',
    required: ['name'],
    additionalProperties: false,
    properties: {
        name: { type: 'string', minLength: 1, maxLength: 80 },
        role: { type: 'string', minLength: 1, maxLength: 60 },
    },
} as const

const patchSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        name: { type: 'string', minLength: 1, maxLength: 80 },
        role: { type: 'string', minLength: 1, maxLength: 60 },
        active: { type: 'boolean' },
    },
} as const

const accessSchema = {
    type: 'object',
    required: ['permissions', 'limits'],
    additionalProperties: false,
    properties: {
        permissions: {
            type: 'object',
            additionalProperties: false,
            properties: Object.fromEntries(PERMISSIONS.map((key) => [key, { type: 'boolean' }])),
        },
        limits: {
            type: 'object',
            additionalProperties: false,
            properties: Object.fromEntries(
                LIMITABLE_RESOURCES.map((key) => [key, { type: ['integer', 'null'], minimum: 0, maximum: 1_000_000 }])
            ),
        },
    },
} as const

const keySchema = {
    type: 'object',
    required: ['name'],
    additionalProperties: false,
    properties: {
        name: { type: 'string', minLength: 1, maxLength: 80 },
        scopes: { type: 'array', maxItems: 100, items: { type: 'string', enum: [...PERMISSIONS] } },
        expiresAt: { type: ['string', 'null'], maxLength: 40 },
    },
} as const

const listServiceAccountsEndpoint = async (): Promise<ServiceAccount[]> => accounts().list()

const createServiceAccountEndpoint = async (
    request: FastifyRequest<{ Body: ServiceAccountDraft }>,
    reply: FastifyReply
): Promise<ServiceAccount | { error: string }> => {
    try {
        const created = await accounts().create(request.body)
        void recordAudit(
            request.user!,
            'create_service_account',
            created.id,
            `${created.name}, role=${created.role}`,
            request.id
        )
        reply.code(201)
        return created
    } catch (error) {
        return sendError(reply, error)
    }
}

const patchServiceAccountEndpoint = async (
    request: FastifyRequest<{ Params: { id: string }; Body: { name?: string; role?: UserRole; active?: boolean } }>,
    reply: FastifyReply
): Promise<ServiceAccount | { error: string }> => {
    try {
        const updated = await accounts().update(request.params.id, request.body)
        void recordAudit(
            request.user!,
            'update_service_account',
            updated.id,
            Object.entries(request.body).map(([key, value]) => `${key}=${value}`).join(', '),
            request.id
        )
        return updated
    } catch (error) {
        return sendError(reply, error)
    }
}

const deleteServiceAccountEndpoint = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
): Promise<null | { error: string }> => {
    try {
        await accounts().remove(request.params.id)
        void recordAudit(request.user!, 'delete_service_account', request.params.id, '', request.id)
        reply.code(204)
        return null
    } catch (error) {
        return sendError(reply, error)
    }
}

const getServiceAccountAccessEndpoint = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
): Promise<UserAccessPayload | { error: string }> => {
    try {
        return await accounts().getAccess(request.params.id)
    } catch (error) {
        return sendError(reply, error)
    }
}

const saveServiceAccountAccessEndpoint = async (
    request: FastifyRequest<{ Params: { id: string }; Body: UserAccessOverrides }>,
    reply: FastifyReply
): Promise<UserAccessPayload | { error: string }> => {
    try {
        const saved = await accounts().saveAccess(request.params.id, request.body)
        void recordAudit(
            request.user!,
            'update_service_account_access',
            request.params.id,
            `permissions=${Object.keys(saved.permissions).length} limits=${Object.keys(saved.limits).length}`,
            request.id
        )
        return saved
    } catch (error) {
        return sendError(reply, error)
    }
}

const listServiceKeysEndpoint = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
): Promise<ApiKey[] | { error: string }> => {
    try {
        return await accounts().listKeys(request.params.id)
    } catch (error) {
        return sendError(reply, error)
    }
}

const createServiceKeyEndpoint = async (
    request: FastifyRequest<{ Params: { id: string }; Body: ApiKeyDraft }>,
    reply: FastifyReply
): Promise<ApiKeyIssued | { error: string }> => {
    try {
        const issued = await accounts().createKey(request.params.id, request.body)
        void recordAudit(
            request.user!,
            'create_service_key',
            issued.key.id,
            `${issued.key.name} for ${request.params.id}`,
            request.id
        )
        reply.code(201)
        return issued
    } catch (error) {
        return sendError(reply, error)
    }
}

const revokeServiceKeyEndpoint = async (
    request: FastifyRequest<{ Params: { id: string; keyId: string } }>,
    reply: FastifyReply
): Promise<null | { error: string }> => {
    try {
        await accounts().revokeKey(request.params.id, request.params.keyId)
        void recordAudit(
            request.user!,
            'revoke_service_key',
            request.params.keyId,
            `for ${request.params.id}`,
            request.id
        )
        reply.code(204)
        return null
    } catch (error) {
        return sendError(reply, error)
    }
}

export const serviceAccountRouter: FastifyPluginAsync = async (app) => {
    app.addHook('preHandler', requireAuth)

    app.get(
        '/api/service-accounts',
        { preHandler: [requirePermission('admin.service.read')] },
        listServiceAccountsEndpoint
    )

    app.post<{ Body: ServiceAccountDraft }>(
        '/api/service-accounts',
        { schema: { body: createSchema }, preHandler: [requirePermission('admin.service.write')] },
        createServiceAccountEndpoint
    )

    app.patch<{ Params: { id: string }; Body: { name?: string; role?: UserRole; active?: boolean } }>(
        '/api/service-accounts/:id',
        { schema: { body: patchSchema }, preHandler: [requirePermission('admin.service.write')] },
        patchServiceAccountEndpoint
    )

    app.delete<{ Params: { id: string } }>(
        '/api/service-accounts/:id',
        { preHandler: [requirePermission('admin.service.write')] },
        deleteServiceAccountEndpoint
    )

    app.get<{ Params: { id: string } }>(
        '/api/service-accounts/:id/access',
        { preHandler: [requirePermission('admin.service.write')] },
        getServiceAccountAccessEndpoint
    )

    app.put<{ Params: { id: string }; Body: UserAccessOverrides }>(
        '/api/service-accounts/:id/access',
        { schema: { body: accessSchema }, preHandler: [requirePermission('admin.service.write')] },
        saveServiceAccountAccessEndpoint
    )

    app.get<{ Params: { id: string } }>(
        '/api/service-accounts/:id/keys',
        { preHandler: [requirePermission('admin.service.read')] },
        listServiceKeysEndpoint
    )

    app.post<{ Params: { id: string }; Body: ApiKeyDraft }>(
        '/api/service-accounts/:id/keys',
        { schema: { body: keySchema }, preHandler: [requirePermission('admin.service.write')] },
        createServiceKeyEndpoint
    )

    app.delete<{ Params: { id: string; keyId: string } }>(
        '/api/service-accounts/:id/keys/:keyId',
        { preHandler: [requirePermission('admin.service.write')] },
        revokeServiceKeyEndpoint
    )

}
