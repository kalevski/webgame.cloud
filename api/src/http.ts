import Fastify from 'fastify'
import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { injectable } from 'tsyringe'
import { registerAuth } from './auth.js'
import { registerProjectAuth } from './projectAuth.js'
import { REALM_ROUTE_PREFIXES, registerRealmAuth } from './realmAuth.js'
import type { ApiErrorCode } from './contracts/index.js'
import { encodeErrorCause } from './contracts/index.js'
import { CONTROL_PORT, CORS_ORIGIN, DEV_LOGIN, PORT } from './env.js'
import { AppError } from './domain/errors.js'

import { reportError } from './domain/observability.js'
import { registerEnvelope } from './http/envelope.js'
import { registerSecurityHeaders } from './http/headers.js'
import { registerHttpCache } from './http/httpCache.js'
import { registerIdempotency } from './http/idempotency.js'
import { controlRouter } from './routers/controlRouter.js'
import { healthRouter } from './routers/healthRouter.js'
import { accountRouter } from './routers/accountRouter.js'
import { moderationRouter } from './routers/moderationRouter.js'
import { notificationRouter } from './routers/notificationRouter.js'
import { accessPolicyRouter } from './routers/accessPolicyRouter.js'
import { projectRouter } from './routers/projectRouter.js'
import { inviteRouter } from './routers/inviteRouter.js'
import { realmRouter } from './routers/realmRouter.js'
import { assetRouter } from './routers/assetRouter.js'
import { internalRouter } from './routers/internalRouter.js'
import { bundleRouter } from './routers/bundleRouter.js'
import { buildRouter } from './routers/buildRouter.js'
import { configRouter } from './routers/configRouter.js'
import { translationRouter } from './routers/translationRouter.js'
import { publicGameRouter } from './routers/publicGameRouter.js'
import { publicWaitlistRouter, waitlistRouter } from './routers/waitlistRouter.js'
import { roleApplicationRouter } from './routers/roleApplicationRouter.js'
import { ticketRouter } from './routers/ticketRouter.js'
import { billingRouter, publicBillingRouter } from './routers/billingRouter.js'
import { billingWebhookRouter } from './routers/billingWebhookRouter.js'
import { emailRouter } from './routers/emailRouter.js'
import { platformRouter } from './routers/platformRouter.js'
import { filesRouter } from './routers/filesRouter.js'
import { signingRouter } from './routers/signingRouter.js'
import { authRouter } from './routers/authRouter.js'
import { userRouter } from './routers/userRouter.js'
import { serviceAccountRouter } from './routers/serviceAccountRouter.js'

const ROUTE_PLUGINS = [
    healthRouter,
    authRouter,
    accountRouter,
    userRouter,
    serviceAccountRouter,
    accessPolicyRouter,
    roleApplicationRouter,
    notificationRouter,
    moderationRouter,
    projectRouter,
    inviteRouter,
    realmRouter,
    assetRouter,
    internalRouter,
    bundleRouter,
    buildRouter,
    configRouter,
    translationRouter,
    ticketRouter,
    publicGameRouter,
    publicWaitlistRouter,
    waitlistRouter,
    billingRouter,
    publicBillingRouter,
    billingWebhookRouter,
    emailRouter,
    platformRouter,
    filesRouter,
    signingRouter,
]

const CONTROL_PLUGINS = [
    controlRouter,
]

const ALLOWED_HEADERS = 'content-type, authorization, idempotency-key'

const EXPOSED_HEADERS = 'x-request-id, retry-after, idempotent-replay'

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
const LOCALHOST_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/

const originAllowed = (origin: string, selfOrigin: string): boolean =>
    origin === selfOrigin ||
    (CORS_ORIGIN !== '' && origin === CORS_ORIGIN) ||
    (DEV_LOGIN && LOCALHOST_ORIGIN.test(origin))

const CLIENT_ERROR_CAUSES: Partial<Record<number, ApiErrorCode>> = {
    400: 'invalid_body',
    404: 'not_found',
    413: 'payload_too_large',
    415: 'unsupported_media_type',
    429: 'request_failed',
}

const errorHandler = (error: FastifyError, request: FastifyRequest, reply: FastifyReply): void => {
    if (error instanceof AppError) {
        reply.code(error.status).send({ error: encodeErrorCause(error.code, ...error.params) })
        return
    }
    if (error.validation) {
        const detail = error.validation[0]
        const field = detail?.instancePath?.slice(1).replaceAll('/', '.')
            || String((detail?.params as Record<string, unknown> | undefined)?.missingProperty ?? 'body')
        reply.code(400).send({ error: encodeErrorCause('invalid_body', field) })
        return
    }
    const status = error.statusCode ?? 500
    if (status >= 400 && status < 500) {
        request.log.warn(error)
        reply.code(status).send({ error: encodeErrorCause(CLIENT_ERROR_CAUSES[status] ?? 'invalid_input') })
        return
    }

    request.log.error(error)
    reportError(error, {
        source: `${request.method} ${request.routeOptions?.url ?? request.url}`,
        requestId: String(request.id),
    })
    reply.code(500).send({ error: encodeErrorCause('internal_error') })
}

@injectable()
export class Http {
    public server!: FastifyInstance

    public control!: FastifyInstance

    async init(): Promise<void> {
        this.server = Fastify({ logger: true, trustProxy: true })

        if (CORS_ORIGIN) {
            this.server.addHook('onRequest', async (request, reply) => {
                reply.header('access-control-allow-origin', CORS_ORIGIN)
                reply.header('access-control-allow-credentials', 'true')
                reply.header('vary', 'Origin')
                reply.header('access-control-expose-headers', EXPOSED_HEADERS)
                if (request.method === 'OPTIONS') {
                    reply
                        .header('access-control-allow-methods', 'GET,POST,PUT,PATCH,DELETE')
                        .header('access-control-allow-headers', ALLOWED_HEADERS)
                        .header('access-control-max-age', '86400')
                        .code(204)
                        .send()
                }
            })
        }

        this.server.addHook('onRequest', async (request, reply) => {
            if (!MUTATING.has(request.method)) return
            if (REALM_ROUTE_PREFIXES.some((prefix) => request.url.startsWith(prefix))) return
            if (request.url.startsWith('/api/public/')) return
            const origin = request.headers.origin
            if (!origin) return

            const selfOrigin = `${request.protocol}://${request.hostname}`
            if (originAllowed(origin, selfOrigin)) return
            reply.code(403).send({ error: encodeErrorCause('cross_origin_rejected') })
            return reply
        })

        registerSecurityHeaders(this.server)
        registerEnvelope(this.server)
        registerAuth(this.server)
        registerProjectAuth(this.server)
        registerRealmAuth(this.server)
        registerIdempotency(this.server)
        registerHttpCache(this.server)

        this.server.setErrorHandler(errorHandler)

        for (const plugin of ROUTE_PLUGINS) {
            await this.server.register(plugin)
        }

        this.control = Fastify({ logger: true })

        registerEnvelope(this.control)

        this.control.setErrorHandler(errorHandler)

        for (const plugin of CONTROL_PLUGINS) {
            await this.control.register(plugin)
        }
    }

    async run(): Promise<void> {
        await this.server.listen({ port: PORT, host: '0.0.0.0' })
        await this.control.listen({ port: CONTROL_PORT, host: '127.0.0.1' })
    }

    async dispose(): Promise<void> {
        await this.server?.close()
        await this.control?.close()
    }
}
