import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import type { RealmDraft, RealmHeartbeat, RealmRegionDraft } from '../contracts/index.js'
import { REALM_HEALTH, REALM_STATUSES, encodeErrorCause } from '../contracts/index.js'
import { requireAuth, requirePermission } from '../auth.js'
import { requireRealm } from '../realmAuth.js'
import container from '../container.js'
import { RealmService } from '../services/RealmService.js'
import { recordAudit } from '../audit.js'

const realms = () => container.resolve(RealmService)

const realmSchema = {
    type: 'object',
    required: ['name', 'baseUrl'],
    additionalProperties: false,
    properties: {
        name: { type: 'string', minLength: 1, maxLength: 120 },
        baseUrl: { type: 'string', minLength: 1, maxLength: 500 },
        regionId: { type: ['string', 'null'], maxLength: 80 },
        planId: { type: ['string', 'null'], maxLength: 80 },
        exclusive: { type: 'boolean' },
        status: { type: 'string', enum: [...REALM_STATUSES] },
    },
} as const

const regionSchema = {
    type: 'object',
    required: ['name'],
    additionalProperties: false,
    properties: {
        name: { type: 'string', minLength: 1, maxLength: 60 },
        active: { type: 'boolean' },
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
        cpuUsage: { type: 'number', minimum: 0, maximum: 100 },
        memoryUsedBytes: { type: 'number', minimum: 0 },
        memoryTotalBytes: { type: 'number', minimum: 0 },
    },
} as const

const moveSchema = {
    type: 'object',
    required: ['realmId'],
    additionalProperties: false,
    properties: { realmId: { type: 'string', minLength: 1, maxLength: 80 } },
} as const

const listRealmsEndpoint = async () => realms().list()

const getRealmEndpoint = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) => {
    return await realms().find(request.params.id)
}

const getRealmStatsEndpoint = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) => {
    return await realms().stats(request.params.id)
}

const getRealmSamplesEndpoint = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) => {
    return await realms().sampleSeries(request.params.id)
}

const listRegionsEndpoint = async () => realms().listRegions()

const createRegionEndpoint = async (
    request: FastifyRequest<{ Body: RealmRegionDraft }>,
    reply: FastifyReply
) => {
    const created = await realms().createRegion(request.body)
    if (created.isErr()) {
        reply.code(409)
        return { error: encodeErrorCause('realm_region_name_exists') }
    }
    const region = created.unwrap()
    void recordAudit(request.user!, 'realm.region_created', region.id, region.name, request.id)
    reply.code(201)
    return region
}

const patchRegionEndpoint = async (
    request: FastifyRequest<{ Params: { id: string }; Body: RealmRegionDraft }>,
    reply: FastifyReply
) => {
    const updated = await realms().updateRegion(request.params.id, request.body)
    if (updated.isErr()) {
        reply.code(409)
        return { error: encodeErrorCause('realm_region_name_exists') }
    }
    const region = updated.unwrap()
    void recordAudit(request.user!, 'realm.region_updated', region.id, region.name, request.id)
    return region
}

const deleteRegionEndpoint = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) => {
    await realms().removeRegion(request.params.id)
    void recordAudit(request.user!, 'realm.region_deleted', request.params.id, '', request.id)
    reply.code(204)
    return null
}

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
    const updated = await realms().update(request.params.id, request.body)
    if (updated.isErr()) {
        reply.code(409)
        return { error: encodeErrorCause('realm_name_exists') }
    }
    const realm = updated.unwrap()
    void recordAudit(request.user!, 'realm.updated', realm.id, realm.name, request.id)
    return realm
}

const deleteRealmEndpoint = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) => {
    await realms().remove(request.params.id)
    void recordAudit(request.user!, 'realm.deleted', request.params.id, '', request.id)
    reply.code(204)
    return null
}

const rotateTokenEndpoint = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) => {
    const issued = await realms().rotateToken(request.params.id)
    void recordAudit(request.user!, 'realm.token_rotated', issued.realm.id, issued.realm.name, request.id)
    return issued
}

const moveProjectEndpoint = async (
    request: FastifyRequest<{ Params: { id: string }; Body: { realmId: string } }>,
    reply: FastifyReply
) => {
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
}

const heartbeatEndpoint = async (
    request: FastifyRequest<{ Body: RealmHeartbeat }>,
    reply: FastifyReply
) => {
    await realms().heartbeat(request.realm!.id, {
        health: request.body.health,
        diskFreeBytes: request.body.diskFreeBytes ?? 0,
        queueDepth: request.body.queueDepth ?? 0,
        cpuUsage: request.body.cpuUsage ?? 0,
        memoryUsedBytes: request.body.memoryUsedBytes ?? 0,
        memoryTotalBytes: request.body.memoryTotalBytes ?? 0,
    })
    reply.code(204)
    return null
}

export const realmRouter: FastifyPluginAsync = async (app) => {
    app.get('/api/realms', { preHandler: [requireAuth, requirePermission('realm.read')] }, listRealmsEndpoint)

    app.get(
        '/api/realm-regions',
        { preHandler: [requireAuth, requirePermission('realm.read')] },
        listRegionsEndpoint
    )

    app.post<{ Body: RealmRegionDraft }>(
        '/api/realm-regions',
        { schema: { body: regionSchema }, preHandler: [requireAuth, requirePermission('realm.write')] },
        createRegionEndpoint
    )

    app.patch<{ Params: { id: string }; Body: RealmRegionDraft }>(
        '/api/realm-regions/:id',
        {
            schema: { body: { ...regionSchema, required: [] } },
            preHandler: [requireAuth, requirePermission('realm.write')],
        },
        patchRegionEndpoint
    )

    app.delete<{ Params: { id: string } }>(
        '/api/realm-regions/:id',
        { preHandler: [requireAuth, requirePermission('realm.write')] },
        deleteRegionEndpoint
    )

    app.get<{ Params: { id: string } }>(
        '/api/realms/:id',
        { preHandler: [requireAuth, requirePermission('realm.read')] },
        getRealmEndpoint
    )

    app.get<{ Params: { id: string } }>(
        '/api/realms/:id/stats',
        { preHandler: [requireAuth, requirePermission('realm.read')] },
        getRealmStatsEndpoint
    )

    app.get<{ Params: { id: string } }>(
        '/api/realms/:id/samples',
        { preHandler: [requireAuth, requirePermission('realm.read')] },
        getRealmSamplesEndpoint
    )

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
