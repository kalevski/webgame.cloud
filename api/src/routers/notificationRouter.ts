import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import type { NotificationsResult, PushSubscriptionDraft } from '../contracts/index.js'
import { requireAuth } from '../auth.js'
import container from '../container.js'
import { NotificationService } from '../services/NotificationService.js'
import { PushService } from '../services/PushService.js'
import { sendError } from './sendError.js'

const notifications = () => container.resolve(NotificationService)
const push = () => container.resolve(PushService)

const readSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        ids: { type: 'array', maxItems: 100, items: { type: 'string', minLength: 1, maxLength: 100 } },
    },
} as const

const subscriptionSchema = {
    type: 'object',
    required: ['endpoint', 'p256dh', 'auth'],
    additionalProperties: false,
    properties: {
        endpoint: { type: 'string', minLength: 1, maxLength: 2000 },
        p256dh: { type: 'string', minLength: 1, maxLength: 500 },
        auth: { type: 'string', minLength: 1, maxLength: 500 },
    },
} as const

const unsubscribeSchema = {
    type: 'object',
    required: ['endpoint'],
    additionalProperties: false,
    properties: {
        endpoint: { type: 'string', minLength: 1, maxLength: 2000 },
    },
} as const

const listNotificationsEndpoint = async (request: FastifyRequest): Promise<NotificationsResult> =>
    notifications().list(request.user!.id)

const markReadEndpoint = async (request: FastifyRequest<{ Body: { ids?: string[] } }>, reply: FastifyReply) => {
    await notifications().markRead(request.user!.id, request.body.ids)
    reply.code(204)
    return null
}

const pushPublicKeyEndpoint = async () => ({ publicKey: await push().getVapidPublicKey() })

const subscribePushEndpoint = async (request: FastifyRequest<{ Body: PushSubscriptionDraft }>, reply: FastifyReply) => {
    try {
        await push().subscribe(request.user!.id, request.body)
        reply.code(201)
        return { ok: true }
    } catch (error) {
        return sendError(reply, error)
    }
}

const unsubscribePushEndpoint = async (request: FastifyRequest<{ Body: { endpoint: string } }>, reply: FastifyReply) => {
    await push().unsubscribe(request.user!.id, request.body.endpoint)
    reply.code(204)
    return null
}

export const notificationRouter: FastifyPluginAsync = async (app) => {
    app.addHook('preHandler', requireAuth)

    app.get('/api/notifications', listNotificationsEndpoint)

    app.post<{ Body: { ids?: string[] } }>(
        '/api/notifications/read',
        { schema: { body: readSchema } },
        markReadEndpoint
    )

    app.get('/api/push/public-key', pushPublicKeyEndpoint)

    app.post<{ Body: PushSubscriptionDraft }>(
        '/api/push/subscriptions',
        { schema: { body: subscriptionSchema } },
        subscribePushEndpoint
    )

    app.post<{ Body: { endpoint: string } }>(
        '/api/push/unsubscribe',
        { schema: { body: unsubscribeSchema } },
        unsubscribePushEndpoint
    )

}
