import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import type { WaitlistSignupDraft } from '../contracts/index.js'
import { encodeErrorCause } from '../contracts/index.js'
import { requireAuth, requirePermission } from '../auth.js'
import { rateLimit } from '../http/rateLimit.js'
import container from '../container.js'
import { WaitlistService } from '../services/WaitlistService.js'
import { UserService } from '../services/UserService.js'
import { sendError } from './sendError.js'
import { recordAudit } from '../audit.js'

const waitlist = () => container.resolve(WaitlistService)
const users = () => container.resolve(UserService)

const signupSchema = {
    type: 'object',
    required: ['email'],
    additionalProperties: false,
    properties: {
        email: { type: 'string', minLength: 3, maxLength: 320 },
        marketingOptIn: { type: 'boolean' },
        consentVersion: { type: 'string', maxLength: 80 },
        source: { type: 'string', maxLength: 80 },
        website: { type: 'string', maxLength: 200 },
    },
} as const

const grantSchema = {
    type: 'object',
    required: ['userId'],
    additionalProperties: false,
    properties: { userId: { type: 'string', minLength: 1, maxLength: 80 } },
} as const

const signupEndpoint = async (
    request: FastifyRequest<{ Body: WaitlistSignupDraft }>,
    reply: FastifyReply
) => {
    try {
        await waitlist().signup(request.body)
        void recordAudit(null, 'waitlist.signup', '', request.body.source ?? 'landing', request.id)
        reply.code(204)
        return null
    } catch (error) {
        return sendError(reply, error)
    }
}

const listEndpoint = async (
    request: FastifyRequest<{ Querystring: { limit?: number; offset?: number; cursor?: string } }>
) => waitlist().list(request.query)

const statsEndpoint = async () => waitlist().stats()

const grantEndpoint = async (
    request: FastifyRequest<{ Params: { id: string }; Body: { userId: string } }>,
    reply: FastifyReply
) => {
    try {
        const user = await users().findById(request.body.userId)
        if (!user) {
            reply.code(404)
            return { error: encodeErrorCause('user_not_found') }
        }
        await waitlist().grantTo(request.params.id, user)
        void recordAudit(request.user!, 'waitlist.granted', request.params.id, request.body.userId, request.id)
        reply.code(204)
        return null
    } catch (error) {
        return sendError(reply, error)
    }
}

export const publicWaitlistRouter: FastifyPluginAsync = async (app) => {
    app.post<{ Body: WaitlistSignupDraft }>(
        '/api/public/waitlist',
        {
            config: { envelope: false },
            schema: { body: signupSchema },
            preHandler: [rateLimit({ name: 'waitlist', max: 5, windowSeconds: 3600, by: (request) => request.ip })],
        },
        signupEndpoint
    )

    app.get('/api/public/waitlist/stats', { config: { envelope: false } }, statsEndpoint)
}

export const waitlistRouter: FastifyPluginAsync = async (app) => {
    app.addHook('preHandler', requireAuth)

    app.get<{ Querystring: { limit?: number; offset?: number; cursor?: string } }>(
        '/api/admin/waitlist',
        { preHandler: [requirePermission('waitlist.read')] },
        listEndpoint
    )

    app.post<{ Params: { id: string }; Body: { userId: string } }>(
        '/api/admin/waitlist/:id/grant',
        { schema: { body: grantSchema }, preHandler: [requirePermission('waitlist.read')] },
        grantEndpoint
    )
}
