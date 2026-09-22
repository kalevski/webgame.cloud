import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import type { FinalizeUpload } from '../contracts/index.js'
import { requireRealm } from '../realmAuth.js'
import container from '../container.js'
import { UploadService } from '../services/UploadService.js'

const uploads = () => container.resolve(UploadService)

const finalizeSchema = {
    type: 'object',
    required: ['sizeBytes', 'checksum', 'storagePath', 'status'],
    additionalProperties: false,
    properties: {
        sizeBytes: { type: 'number', minimum: 0 },
        checksum: { type: 'string', maxLength: 200 },
        storagePath: { type: 'string', maxLength: 1000 },
        status: { type: 'string', enum: ['ready', 'failed'] },
        error: { type: 'string', maxLength: 1000 },
    },
} as const

const finalizeEndpoint = async (
    request: FastifyRequest<{ Params: { assetId: string }; Body: FinalizeUpload }>,
    reply: FastifyReply
) => {
    return await uploads().finalize(request.realm!, request.params.assetId, request.body)
}

export const internalRouter: FastifyPluginAsync = async (app) => {
    app.post<{ Params: { assetId: string }; Body: FinalizeUpload }>(
        '/api/internal/uploads/:assetId/finalize',
        { schema: { body: finalizeSchema }, preHandler: [requireRealm] },
        finalizeEndpoint
    )
}
