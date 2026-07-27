import Fastify from 'fastify'
import type { FastifyError, FastifyInstance } from 'fastify'
import { injectable } from 'tsyringe'
import { registerAuth } from './auth.js'
import { encodeErrorCause } from './contracts/index.js'
import { CORS_ORIGIN, DEV_LOGIN, PORT } from './env.js'

import { registerEnvelope } from './http/envelope.js'
import { registerSecurityHeaders } from './http/headers.js'
import { registerIdempotency } from './http/idempotency.js'
import { healthRouter } from './routers/healthRouter.js'
import { accountRouter } from './routers/accountRouter.js'
import { moderationRouter } from './routers/moderationRouter.js'
import { notificationRouter } from './routers/notificationRouter.js'
import { accessPolicyRouter } from './routers/accessPolicyRouter.js'
import { projectRouter } from './routers/projectRouter.js'
import { billingRouter, publicBillingRouter } from './routers/billingRouter.js'
import { emailRouter } from './routers/emailRouter.js'
import { platformRouter } from './routers/platformRouter.js'
import { filesRouter } from './routers/filesRouter.js'
import { signingRouter } from './routers/signingRouter.js'
import { authRouter } from './routers/authRouter.js'
import { userRouter } from './routers/userRouter.js'

const ROUTE_PLUGINS = [
    healthRouter,
    authRouter,
    accountRouter,
    userRouter,
    accessPolicyRouter,
    notificationRouter,
    moderationRouter,
    projectRouter,
    billingRouter,
    publicBillingRouter,
    emailRouter,
    platformRouter,
    filesRouter,
    signingRouter,
]

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
const LOCALHOST_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/

const originAllowed = (origin: string, selfOrigin: string): boolean =>
    origin === selfOrigin ||
    (CORS_ORIGIN !== '' && origin === CORS_ORIGIN) ||
    (DEV_LOGIN && LOCALHOST_ORIGIN.test(origin))

@injectable()
export class Http {
    public server!: FastifyInstance

    async init(): Promise<void> {
        this.server = Fastify({ logger: true, trustProxy: true })

        if (CORS_ORIGIN) {
            this.server.addHook('onRequest', async (request, reply) => {
                reply.header('access-control-allow-origin', CORS_ORIGIN)
                reply.header('access-control-allow-credentials', 'true')
                reply.header('vary', 'Origin')
                if (request.method === 'OPTIONS') {
                    reply
                        .header('access-control-allow-methods', 'GET,POST,PUT,PATCH,DELETE')
                        .header('access-control-allow-headers', 'content-type')
                        .header('access-control-max-age', '86400')
                        .code(204)
                        .send()
                }
            })
        }

        this.server.addHook('onRequest', async (request, reply) => {
            if (!MUTATING.has(request.method)) return
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
        registerIdempotency(this.server)

        this.server.setErrorHandler((error: FastifyError, request, reply) => {
            if (error.validation) {
                const detail = error.validation[0]
                const field = detail?.instancePath?.slice(1).replaceAll('/', '.')
                    || String((detail?.params as Record<string, unknown> | undefined)?.missingProperty ?? 'body')
                reply.code(400).send({ error: encodeErrorCause('invalid_body', field) })
                return
            }
            request.log.error(error)
            reply.code(500).send({ error: encodeErrorCause('internal_error') })
        })

        for (const plugin of ROUTE_PLUGINS) {
            await this.server.register(plugin)
        }
    }

    async run(): Promise<void> {
        await this.server.listen({ port: PORT, host: '0.0.0.0' })
    }

    async dispose(): Promise<void> {
        await this.server?.close()
    }
}
