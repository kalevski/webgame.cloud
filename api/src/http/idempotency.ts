import { createHash } from 'node:crypto'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import container from '../container.js'
import { encodeErrorCause } from '../contracts/index.js'
import { PlatformRepository } from '../repositories/platform/PlatformRepository.js'

const HEADER = 'idempotency-key'

const MUTATING = new Set(['POST', 'PUT', 'PATCH'])

const STALE_RESERVATION_SECONDS = 300

declare module 'fastify' {
    interface FastifyRequest {
        idempotencyKey?: string
    }
}

const routeOf = (request: FastifyRequest): string =>
    `${request.method} ${request.routeOptions?.url ?? request.url}`

const keyOf = (request: FastifyRequest): string | undefined => {
    if (!MUTATING.has(request.method)) return undefined
    if (!request.user) return undefined

    const raw = request.headers[HEADER]
    const value = Array.isArray(raw) ? raw[0] : raw
    const client = value?.trim().slice(0, 200)
    if (!client) return undefined

    return `${request.user.id}|${routeOf(request)}|${client}`
}

const fingerprintOf = (request: FastifyRequest): string =>
    createHash('sha256')
        .update(routeOf(request))
        .update('\0')
        .update(JSON.stringify(request.body ?? null))
        .digest('hex')

export const registerIdempotency = (app: FastifyInstance): void => {
    app.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
        const key = keyOf(request)
        if (!key) return

        const platform = container.resolve(PlatformRepository)
        const fingerprint = fingerprintOf(request)

        const reserved = await platform.reserveIdempotency({
            key,
            userId: request.user?.id ?? null,
            endpoint: routeOf(request),
            fingerprint,
            staleAfterSeconds: STALE_RESERVATION_SECONDS,
        })
        if (reserved) {
            request.idempotencyKey = key
            return
        }

        const stored = await platform.findIdempotency(key)
        if (!stored) {
            request.idempotencyKey = key
            return
        }

        if (stored.fingerprint !== fingerprint) {
            reply.code(409).send({ error: encodeErrorCause('idempotency_key_reused') })
            return reply
        }

        if (stored.status_code === 0) {
            reply.header('retry-after', '1')
            reply.code(409).send({ error: encodeErrorCause('idempotency_in_flight') })
            return reply
        }

        reply.header('idempotent-replay', 'true')
        reply.code(stored.status_code).send(stored.response)
        return reply
    })

    app.addHook('onSend', async (request, reply, payload) => {
        const key = request.idempotencyKey
        if (!key) return payload

        if (reply.statusCode >= 400) {
            await container.resolve(PlatformRepository).releaseIdempotency(key)
            return payload
        }

        let body: unknown = null
        if (typeof payload === 'string') {
            try {
                body = JSON.parse(payload)
            } catch {
                body = null
            }
        }

        await container.resolve(PlatformRepository).completeIdempotency({
            key,
            statusCode: reply.statusCode,
            response: body,
        })

        return payload
    })
}
