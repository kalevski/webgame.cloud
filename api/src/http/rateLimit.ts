import type { FastifyReply, FastifyRequest } from 'fastify'
import container from '../container.js'
import { encodeErrorCause } from '../contracts/index.js'
import { PlatformRepository } from '../repositories/platform/PlatformRepository.js'

export type RateLimitOptions = {
    name: string
    max: number
    windowSeconds: number
    by?: (request: FastifyRequest) => string
}

const defaultKey = (request: FastifyRequest): string => request.user?.id ?? request.ip

export const rateLimit = (options: RateLimitOptions) =>
    async (request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply | void> => {
        const subject = (options.by ?? defaultKey)(request)
        const bucket = `${options.name}:${subject}`

        const { hits, windowStart } = await container.resolve(PlatformRepository)
            .hitRateLimit(bucket, options.windowSeconds)

        if (hits <= options.max) return

        const resetAt = windowStart.getTime() + options.windowSeconds * 1000
        const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))

        reply.header('retry-after', String(retryAfter))
        reply.code(429).send({ error: encodeErrorCause('rate_limited', String(retryAfter)) })
        return reply
    }

export const emailKey = (request: FastifyRequest): string => {
    const body = request.body as { email?: string } | undefined
    return `${request.ip}:${(body?.email ?? '').trim().toLowerCase()}`
}
