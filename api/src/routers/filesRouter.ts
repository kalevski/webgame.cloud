import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import multipart from '@fastify/multipart'
import container from '../container.js'
import { requireAuth, requirePermission } from '../auth.js'
import { requireFeature } from '../features.js'
import { recordAudit } from '../audit.js'
import { sendError } from './sendError.js'
import { FileService } from '../services/FileService.js'
import { encodeErrorCause } from '../contracts/index.js'
import type { FileSource, FileSourceDraft, FileType, FileTypeBindings, StoredFile, User } from '../contracts/index.js'
import { FILE_SOURCE_TYPES, FILE_TYPES, OWNER_ROLE_ID } from '../contracts/index.js'

const UPLOAD_MAX_BYTES = 20 * 1024 * 1024

const files = () => container.resolve(FileService)

const canAccessFile = (user: User, file: StoredFile): boolean =>
    user.role === OWNER_ROLE_ID || file.ownerId === user.id

const fileSourceConfigSchema = {
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

const fileSourceSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['name', 'type'],
    properties: {
        name: { type: 'string', minLength: 1, maxLength: 120 },
        type: { type: 'string', enum: [...FILE_SOURCE_TYPES] },
        config: fileSourceConfigSchema,
        secret: { type: 'string', maxLength: 500 },
    },
} as const

const bindingsSchema = {
    type: 'object',
    additionalProperties: false,
    properties: Object.fromEntries(
        FILE_TYPES.map((fileType) => [fileType, { type: ['string', 'null'], maxLength: 80 }])
    ),
} as const

const listSourcesEndpoint = async (): Promise<FileSource[]> => files().listSources()

const createSourceEndpoint = async (
    request: FastifyRequest<{ Body: FileSourceDraft }>,
    reply: FastifyReply
): Promise<FileSource | { error: string }> => {
    try {
        const created = await files().createSource(request.body)
        void recordAudit(request.user!, 'create_file_source', created.id, created.name, request.id)
        reply.code(201)
        return created
    } catch (error) {
        return sendError(reply, error)
    }
}

const updateSourceEndpoint = async (
    request: FastifyRequest<{ Params: { sourceId: string }; Body: Partial<FileSourceDraft> }>,
    reply: FastifyReply
): Promise<FileSource | { error: string }> => {
    try {
        const updated = await files().updateSource(request.params.sourceId, request.body)
        void recordAudit(request.user!, 'update_file_source', updated.id, updated.name, request.id)
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
        void recordAudit(request.user!, 'delete_file_source', request.params.sourceId, '', request.id)
        reply.code(204)
        return null
    } catch (error) {
        return sendError(reply, error)
    }
}

const getBindingsEndpoint = async (): Promise<FileTypeBindings> => files().getBindings()

const saveBindingsEndpoint = async (
    request: FastifyRequest<{ Body: Partial<FileTypeBindings> }>,
    reply: FastifyReply
): Promise<FileTypeBindings | { error: string }> => {
    try {
        const saved = await files().saveBindings(request.body)
        void recordAudit(request.user!, 'update_file_bindings', '', JSON.stringify(saved), request.id)
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
            return { error: encodeErrorCause('file_type_invalid') }
        }

        const fileTypeField = data.fields.fileType
        const fileType = fileTypeField && 'value' in fileTypeField ? String(fileTypeField.value) : ''
        const buffer = await data.toBuffer()

        const created = await files().upload(fileType as FileType, request.user!.id, buffer, {
            originalName: data.filename,
            mime: data.mimetype,
        })
        void recordAudit(request.user!, 'upload_file', created.id, created.fileType, request.id)
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
            return { error: encodeErrorCause('file_not_found', request.params.fileId) }
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
            return { error: encodeErrorCause('file_not_found', request.params.fileId) }
        }

        await files().remove(file)
        void recordAudit(request.user!, 'delete_file', file.id, file.fileType, request.id)
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

    app.get('/api/file-sources', { preHandler: [requirePermission('file.source.read')] }, listSourcesEndpoint)

    app.post<{ Body: FileSourceDraft }>(
        '/api/file-sources',
        { schema: { body: fileSourceSchema }, preHandler: [requirePermission('file.source.write')] },
        createSourceEndpoint
    )

    app.patch<{ Params: { sourceId: string }; Body: Partial<FileSourceDraft> }>(
        '/api/file-sources/:sourceId',
        { schema: { body: { ...fileSourceSchema, required: [] } }, preHandler: [requirePermission('file.source.write')] },
        updateSourceEndpoint
    )

    app.delete<{ Params: { sourceId: string } }>(
        '/api/file-sources/:sourceId',
        { preHandler: [requirePermission('file.source.write')] },
        deleteSourceEndpoint
    )

    app.get(
        '/api/file-sources/bindings',
        { preHandler: [requirePermission('file.source.read')] },
        getBindingsEndpoint
    )

    app.put<{ Body: Partial<FileTypeBindings> }>(
        '/api/file-sources/bindings',
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
