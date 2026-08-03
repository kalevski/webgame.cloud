import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import type { AssetPatch, UploadRequest } from '../contracts/index.js'
import { TOOL_ONLY_KINDS } from '../contracts/index.js'
import { requireAuth } from '../auth.js'
import { loadProject, requireProjectPermission } from '../projectAuth.js'
import container from '../container.js'
import { UploadService } from '../services/UploadService.js'
import { RealmService } from '../services/RealmService.js'
import { sendError } from './sendError.js'
import { recordAudit } from '../audit.js'

const uploads = () => container.resolve(UploadService)
const realms = () => container.resolve(RealmService)

const uploadSchema = {
    type: 'object',
    required: ['name', 'sizeBytes', 'mime'],
    additionalProperties: false,
    properties: {
        name: { type: 'string', minLength: 1, maxLength: 300 },
        sizeBytes: { type: 'number', minimum: 0 },
        batchBytes: { type: 'number', minimum: 0 },
        mime: { type: 'string', minLength: 1, maxLength: 200 },
        categoryId: { type: 'string', maxLength: 80 },
        tags: { type: 'array', maxItems: 100, items: { type: 'string', minLength: 1, maxLength: 80 } },
        kind: { type: 'string', enum: [...TOOL_ONLY_KINDS] },
        parentAssetId: { type: 'string', minLength: 1, maxLength: 80 },
    },
} as const

const patchSchema = {
    type: 'object',
    required: ['files'],
    additionalProperties: false,
    properties: {
        files: {
            type: 'array',
            maxItems: 200,
            items: {
                type: 'object',
                required: ['id'],
                additionalProperties: false,
                properties: {
                    id: { type: 'string', minLength: 1, maxLength: 80 },
                    name: { type: 'string', minLength: 1, maxLength: 300 },
                    categoryId: { type: ['string', 'null'], maxLength: 80 },
                    tags: { type: 'array', maxItems: 100, items: { type: 'string', minLength: 1, maxLength: 80 } },
                    parentAssetId: { type: ['string', 'null'], maxLength: 80 },
                },
            },
        },
    },
} as const

const listAssetsEndpoint = async (
    request: FastifyRequest<{ Querystring: { categoryId?: string; tag?: string } }>
) => uploads().list(request.project!.id, request.query)

const requestUploadEndpoint = async (
    request: FastifyRequest<{ Body: UploadRequest }>,
    reply: FastifyReply
) => {
    try {
        const ticket = await uploads().requestUpload(request.user!, request.project!, request.body)
        void recordAudit(request.user!, 'file.uploaded', request.project!.id, request.body.name, request.id)
        reply.code(201)
        return ticket
    } catch (error) {
        return sendError(reply, error)
    }
}

const assetSourceEndpoint = async (
    request: FastifyRequest<{ Params: { id: string; assetId: string } }>,
    reply: FastifyReply
) => {
    try {
        return await uploads().sourceTicket(request.project!, request.params.assetId)
    } catch (error) {
        return sendError(reply, error)
    }
}

const patchAssetsEndpoint = async (
    request: FastifyRequest<{ Body: { files: AssetPatch[] } }>,
    reply: FastifyReply
) => {
    try {
        const files = await uploads().patchMany(request.project!, request.body.files)
        void recordAudit(request.user!, 'file.updated', request.project!.id, String(request.body.files.length), request.id)
        return files
    } catch (error) {
        return sendError(reply, error)
    }
}

const deleteAssetEndpoint = async (
    request: FastifyRequest<{ Params: { id: string; assetId: string } }>,
    reply: FastifyReply
) => {
    try {
        const path = await uploads().remove(request.project!, request.params.assetId)
        if (path) void realms().purgePaths(request.project!.realm_id, [path]).catch(() => undefined)
        void recordAudit(request.user!, 'file.deleted', request.params.assetId, request.project!.id, request.id)
        reply.code(204)
        return null
    } catch (error) {
        return sendError(reply, error)
    }
}

export const assetRouter: FastifyPluginAsync = async (app) => {
    app.addHook('preHandler', requireAuth)

    app.get<{ Params: { id: string }; Querystring: { categoryId?: string; tag?: string } }>(
        '/api/projects/:id/assets',
        { preHandler: [loadProject] },
        listAssetsEndpoint
    )

    app.get<{ Params: { id: string; assetId: string } }>(
        '/api/projects/:id/assets/:assetId/source',
        { preHandler: [loadProject] },
        assetSourceEndpoint
    )

    app.post<{ Params: { id: string }; Body: UploadRequest }>(
        '/api/projects/:id/uploads',
        { schema: { body: uploadSchema }, preHandler: [requireProjectPermission('file.write')] },
        requestUploadEndpoint
    )

    app.put<{ Params: { id: string }; Body: { files: AssetPatch[] } }>(
        '/api/projects/:id/assets',
        { schema: { body: patchSchema }, preHandler: [requireProjectPermission('file.write')] },
        patchAssetsEndpoint
    )

    app.delete<{ Params: { id: string; assetId: string } }>(
        '/api/projects/:id/assets/:assetId',
        { preHandler: [requireProjectPermission('file.write')] },
        deleteAssetEndpoint
    )
}
