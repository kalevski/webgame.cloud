import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import multipart from '@fastify/multipart'
import container from '../container.js'
import { requireAuth, requirePermission } from '../auth.js'
import { requireFeature } from '../features.js'
import { recordAudit } from '../audit.js'
import { sendError } from './sendError.js'
import { FileService } from '../services/FileService.js'
import { encodeErrorCause } from '../contracts/index.js'
import type { AssetSource, AssetSourceDraft, AssetType, AssetTypeBindings, StoredFile, User } from '../contracts/index.js'
import { ASSET_SOURCE_TYPES, ASSET_TYPES, OWNER_ROLE_ID } from '../contracts/index.js'

const UPLOAD_MAX_BYTES = 20 * 1024 * 1024

const files = () => container.resolve(FileService)

const canAccessFile = (user: User, file: StoredFile): boolean =>
    user.role === OWNER_ROLE_ID || file.ownerId === user.id

const assetSourceConfigSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        basePath: { type: 'string', maxLength: 300 },
        bucket: { type: 'string', maxLength: 200 },
        region: { type: 'string', maxLength: 60 },
        endpoint: { type: 'string', maxLength: 300 },
        forcePathStyle: { type: 'boolean' },
        accessKeyId: { type: 'string', maxLength: 200 },
    },
} as const

const assetSourceSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['name', 'type'],
    properties: {
        name: { type: 'string', minLength: 1, maxLength: 120 },
        type: { type: 'string', enum: [...ASSET_SOURCE_TYPES] },
        config: assetSourceConfigSchema,
        secret: { type: 'string', maxLength: 500 },
    },
} as const

const bindingsSchema = {
    type: 'object',
    additionalProperties: false,
    properties: Object.fromEntries(
        ASSET_TYPES.map((assetType) => [assetType, { type: ['string', 'null'], maxLength: 80 }])
    ),
} as const

const listSourcesEndpoint = async (): Promise<AssetSource[]> => files().listSources()

const createSourceEndpoint = async (
    request: FastifyRequest<{ Body: AssetSourceDraft }>,
    reply: FastifyReply
): Promise<AssetSource | { error: string }> => {
    try {
        const created = await files().createSource(request.body)
        void recordAudit(request.user!, 'create_asset_source', created.id, created.name, request.id)
        reply.code(201)
        return created
    } catch (error) {
        return sendError(reply, error)
    }
}

const updateSourceEndpoint = async (
    request: FastifyRequest<{ Params: { sourceId: string }; Body: Partial<AssetSourceDraft> }>,
    reply: FastifyReply
): Promise<AssetSource | { error: string }> => {
    try {
        const updated = await files().updateSource(request.params.sourceId, request.body)
        void recordAudit(request.user!, 'update_asset_source', updated.id, updated.name, request.id)
        return updated
    } catch (error) {
        return sendError(reply, error)
    }
}

const deleteSourceEndpoint = async (
    request: FastifyRequest<{ Params: { sourceId: string } }>,
    reply: FastifyReply
): Promise<null | { error: string }> => {
    try {
        await files().deleteSource(request.params.sourceId)
        void recordAudit(request.user!, 'delete_asset_source', request.params.sourceId, '', request.id)
        reply.code(204)
        return null
    } catch (error) {
        return sendError(reply, error)
    }
}

const getBindingsEndpoint = async (): Promise<AssetTypeBindings> => files().getBindings()

const saveBindingsEndpoint = async (
    request: FastifyRequest<{ Body: Partial<AssetTypeBindings> }>,
    reply: FastifyReply
): Promise<AssetTypeBindings | { error: string }> => {
    try {
        const saved = await files().saveBindings(request.body)
        void recordAudit(request.user!, 'update_asset_bindings', '', JSON.stringify(saved), request.id)
        return saved
    } catch (error) {
        return sendError(reply, error)
    }
}

const uploadFileEndpoint = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<StoredFile | { error: string }> => {
    try {
        const data = await request.file()
        if (!data) {
            reply.code(400)
            return { error: encodeErrorCause('asset_type_invalid') }
        }

        const assetTypeField = data.fields.assetType
        const assetType = assetTypeField && 'value' in assetTypeField ? String(assetTypeField.value) : ''
        const buffer = await data.toBuffer()

        const created = await files().upload(assetType as AssetType, request.user!.id, buffer, {
            originalName: data.filename,
            mime: data.mimetype,
        })
        void recordAudit(request.user!, 'upload_file', created.id, created.assetType, request.id)
        reply.code(201)
        return created
    } catch (error) {
        return sendError(reply, error)
    }
}

const downloadFileEndpoint = async (
    request: FastifyRequest<{ Params: { fileId: string } }>,
    reply: FastifyReply
): Promise<Buffer | { error: string } | undefined> => {
    try {
        const file = await files().get(request.params.fileId)
        if (!canAccessFile(request.user!, file)) {
            reply.code(404)
            return { error: encodeErrorCause('asset_not_found', request.params.fileId) }
        }

        const data = await files().readBytes(file)
        reply.header('content-type', file.mime || 'application/octet-stream')
        reply.header(
            'content-disposition',
            `inline; filename="${encodeURIComponent(file.originalName || file.id)}"`
        )
        return data
    } catch (error) {
        return sendError(reply, error)
    }
}

const deleteFileEndpoint = async (
    request: FastifyRequest<{ Params: { fileId: string } }>,
    reply: FastifyReply
): Promise<null | { error: string }> => {
    try {
        const file = await files().get(request.params.fileId)
        if (!canAccessFile(request.user!, file)) {
            reply.code(404)
            return { error: encodeErrorCause('asset_not_found', request.params.fileId) }
        }

        await files().remove(file)
        void recordAudit(request.user!, 'delete_file', file.id, file.assetType, request.id)
        reply.code(204)
        return null
    } catch (error) {
        return sendError(reply, error)
    }
}

export const filesRouter: FastifyPluginAsync = async (app) => {
    await app.register(multipart, { limits: { fileSize: UPLOAD_MAX_BYTES } })

    app.addHook('preHandler', requireAuth)
    app.addHook('preHandler', requireFeature('files'))

    app.get('/api/asset-sources', { preHandler: [requirePermission('file.source.read')] }, listSourcesEndpoint)

    app.post<{ Body: AssetSourceDraft }>(
        '/api/asset-sources',
        { schema: { body: assetSourceSchema }, preHandler: [requirePermission('file.source.write')] },
        createSourceEndpoint
    )

    app.patch<{ Params: { sourceId: string }; Body: Partial<AssetSourceDraft> }>(
        '/api/asset-sources/:sourceId',
        { schema: { body: { ...assetSourceSchema, required: [] } }, preHandler: [requirePermission('file.source.write')] },
        updateSourceEndpoint
    )

    app.delete<{ Params: { sourceId: string } }>(
        '/api/asset-sources/:sourceId',
        { preHandler: [requirePermission('file.source.write')] },
        deleteSourceEndpoint
    )

    app.get(
        '/api/asset-sources/bindings',
        { preHandler: [requirePermission('file.source.read')] },
        getBindingsEndpoint
    )

    app.put<{ Body: Partial<AssetTypeBindings> }>(
        '/api/asset-sources/bindings',
        { schema: { body: bindingsSchema }, preHandler: [requirePermission('file.source.write')] },
        saveBindingsEndpoint
    )

    app.post(
        '/api/files',
        { preHandler: [requirePermission('file.upload')] },
        uploadFileEndpoint
    )

    app.get<{ Params: { fileId: string } }>('/api/files/:fileId', {}, downloadFileEndpoint)

    app.delete<{ Params: { fileId: string } }>('/api/files/:fileId', {}, deleteFileEndpoint)
}
