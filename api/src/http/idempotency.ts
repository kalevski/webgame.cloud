import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import container from '../container.js'
import { PlatformRepository } from '../repositories/platform/PlatformRepository.js'

const HEADER = 'idempotency-key'

const MUTATING = new Set(['POST', 'PUT', 'PATCH'])

declare module 'fastify' {
    interface FastifyRequest {
        idempotencyKey?: string
    }
}

const keyOf = (request: FastifyRequest): string | undefined => {
    if (!MUTATING.has(request.method)) return undefined
    const raw = request.headers[HEADER]
    const value = Array.isArray(raw) ? raw[0] : raw
    return value?.trim().slice(0, 200) || undefined
}

export const registerIdempotency = (app: FastifyInstance): void => {
    app.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
        const key = keyOf(request)
        if (!key) return

        const stored = await container.resolve(PlatformRepository).findIdempotency(key)
        if (!stored) {
            request.idempotencyKey = key
            return
        }

        reply.header('idempotent-replay', 'true')
        reply.code(stored.status_code || 200).send(stored.response)
        return reply
    })

    app.addHook('onSend', async (request, reply, payload) => {
        const key = request.idempotencyKey
        if (!key || reply.statusCode >= 400) return payload

        let body: unknown = null
        if (typeof payload === 'string') {
            try {
                body = JSON.parse(payload)
            } catch {
                body = null
            }
        }

        await container.resolve(PlatformRepository).saveIdempotency({
            key,
            userId: request.user?.id ?? null,
            endpoint: `${request.method} ${request.routeOptions?.url ?? request.url}`,
            statusCode: reply.statusCode,
            response: body,
        })

        return payload
    })
}
