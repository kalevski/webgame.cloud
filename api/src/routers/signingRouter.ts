import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import type { SigningKey } from '../contracts/index.js'
import { SIGNING_KEYS } from '../contracts/index.js'
import { requireAuth, requirePermission } from '../auth.js'
import container from '../container.js'
import { recordAudit } from '../audit.js'
import { sendError } from './sendError.js'
import { SigningKeyService } from '../services/SigningKeyService.js'

const signing = () => container.resolve(SigningKeyService)

const nameParamsSchema = {
    type: 'object',
    required: ['name'],
    additionalProperties: false,
    properties: {
        name: { type: 'string', enum: [...SIGNING_KEYS] },
    },
} as const

type NameParams = { name: string }

const listSigningKeysEndpoint = async (): Promise<SigningKey[]> => signing().list()

const rotateSigningKeyEndpoint = async (
    request: FastifyRequest<{ Params: NameParams }>,
    reply: FastifyReply
): Promise<SigningKey | { error: string }> => {
    try {
        const key = await signing().rotate(request.params.name)
        void recordAudit(request.user!, 'rotate_signing_key', key.name, key.kid, request.id)
        return key
    } catch (error) {
        return sendError(reply, error)
    }
}

export const signingRouter: FastifyPluginAsync = async (app) => {
    app.addHook('preHandler', requireAuth)

    app.get(
        '/api/signing-keys',
        { preHandler: [requirePermission('signing.key.read')] },
        listSigningKeysEndpoint
    )

    app.post<{ Params: NameParams }>(
        '/api/signing-keys/:name/rotate',
        { schema: { params: nameParamsSchema }, preHandler: [requirePermission('signing.key.rotate')] },
        rotateSigningKeyEndpoint
    )
}
