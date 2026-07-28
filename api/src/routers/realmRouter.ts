import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import type { RealmDraft, RealmHeartbeat } from '../contracts/index.js'
import { REALM_HEALTH, REALM_STATUSES, encodeErrorCause } from '../contracts/index.js'
import { requireAuth, requirePermission } from '../auth.js'
import { requireRealm } from '../realmAuth.js'
import container from '../container.js'
import { RealmService } from '../services/RealmService.js'
import { sendError } from './sendError.js'
import { recordAudit } from '../audit.js'

const realms = () => container.resolve(RealmService)

const realmSchema = {
    type: 'object',
    required: ['name', 'baseUrl'],
    additionalProperties: false,
    properties: {
        name: { type: 'string', minLength: 1, maxLength: 120 },
        baseUrl: { type: 'string', minLength: 1, maxLength: 500 },
        region: { type: 'string', maxLength: 60 },
        planId: { type: ['string', 'null'], maxLength: 80 },
        exclusive: { type: 'boolean' },
        status: { type: 'string', enum: [...REALM_STATUSES] },
    },
} as const

const heartbeatSchema = {
    type: 'object',
    required: ['health'],
    additionalProperties: false,
    properties: {
        health: { type: 'string', enum: [...REALM_HEALTH] },
        diskFreeBytes: { type: 'number', minimum: 0 },
        queueDepth: { type: 'number', minimum: 0 },
    },
} as const

const moveSchema = {
    type: 'object',
    required: ['realmId'],
    additionalProperties: false,
    properties: { realmId: { type: 'string', minLength: 1, maxLength: 80 } },
} as const

const listRealmsEndpoint = async () => realms().list()

const createRealmEndpoint = async (
    request: FastifyRequest<{ Body: RealmDraft }>,
    reply: FastifyReply
) => {
    const created = await realms().create(request.body)
    if (created.isErr()) {
        reply.code(409)
        return { error: encodeErrorCause('realm_name_exists') }
    }
    const issued = created.unwrap()
    void recordAudit(request.user!, 'realm.created', issued.realm.id, issued.realm.name, request.id)
    reply.code(201)
    return issued
}

const patchRealmEndpoint = async (
    request: FastifyRequest<{ Params: { id: string }; Body: RealmDraft }>,
    reply: FastifyReply
) => {
    try {
        const updated = await realms().update(request.params.id, request.body)
        if (updated.isErr()) {
            reply.code(409)
            return { error: encodeErrorCause('realm_name_exists') }
        }
        const realm = updated.unwrap()
        void recordAudit(request.user!, 'realm.updated', realm.id, realm.name, request.id)
        return realm
    } catch (error) {
        return sendError(reply, error)
    }
}

const deleteRealmEndpoint = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) => {
    try {
        await realms().remove(request.params.id)
        void recordAudit(request.user!, 'realm.deleted', request.params.id, '', request.id)
        reply.code(204)
        return null
    } catch (error) {
        return sendError(reply, error)
    }
}

const rotateTokenEndpoint = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) => {
    try {
        const issued = await realms().rotateToken(request.params.id)
        void recordAudit(request.user!, 'realm.token_rotated', issued.realm.id, issued.realm.name, request.id)
        return issued
    } catch (error) {
        return sendError(reply, error)
    }
}

const moveProjectEndpoint = async (
    request: FastifyRequest<{ Params: { id: string }; Body: { realmId: string } }>,
    reply: FastifyReply
) => {
    try {
        const moved = await realms().moveProject(
            request.params.id,
            request.body.realmId,
            request.user!.id
        )
        if (moved.isErr()) {
            reply.code(409)
            return { error: encodeErrorCause('migration_in_progress') }
        }
        void recordAudit(request.user!, 'project.moved', request.params.id, request.body.realmId, request.id)
        reply.code(202)
        return moved.unwrap()
    } catch (error) {
        return sendError(reply, error)
    }
}

const heartbeatEndpoint = async (
    request: FastifyRequest<{ Body: RealmHeartbeat }>,
    reply: FastifyReply
) => {
    await realms().heartbeat(request.realm!.id, {
        health: request.body.health,
        diskFreeBytes: request.body.diskFreeBytes ?? 0,
        queueDepth: request.body.queueDepth ?? 0,
    })
    reply.code(204)
    return null
}

export const realmRouter: FastifyPluginAsync = async (app) => {
    app.get('/api/realms', { preHandler: [requireAuth, requirePermission('realm.read')] }, listRealmsEndpoint)

    app.post<{ Body: RealmDraft }>(
        '/api/realms',
        { schema: { body: realmSchema }, preHandler: [requireAuth, requirePermission('realm.write')] },
        createRealmEndpoint
    )

    app.patch<{ Params: { id: string }; Body: RealmDraft }>(
        '/api/realms/:id',
        {
            schema: { body: { ...realmSchema, required: [] } },
            preHandler: [requireAuth, requirePermission('realm.write')],
        },
        patchRealmEndpoint
    )

    app.delete<{ Params: { id: string } }>(
        '/api/realms/:id',
        { preHandler: [requireAuth, requirePermission('realm.write')] },
        deleteRealmEndpoint
    )

    app.post<{ Params: { id: string } }>(
        '/api/realms/:id/token',
        { preHandler: [requireAuth, requirePermission('realm.write')] },
        rotateTokenEndpoint
    )

    app.post<{ Params: { id: string }; Body: { realmId: string } }>(
        '/api/admin/projects/:id/move',
        {
            schema: { body: moveSchema },
            preHandler: [requireAuth, requirePermission('admin.project.move')],
        },
        moveProjectEndpoint
    )

    app.post<{ Body: RealmHeartbeat }>(
        '/api/realm/heartbeat',
        { schema: { body: heartbeatSchema }, preHandler: [requireRealm] },
        heartbeatEndpoint
    )
}
