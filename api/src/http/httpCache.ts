import { createHash } from 'node:crypto'
import type { FastifyInstance } from 'fastify'

export type CachePolicy = {
    maxAge: number
    staleWhileRevalidate: number
}

declare module 'fastify' {
    interface FastifyContextConfig {
        cache?: CachePolicy
    }
}

export const weakEtag = (payload: string): string =>
    `W/"${createHash('sha1').update(payload).digest('base64url')}"`

export const registerHttpCache = (app: FastifyInstance): void => {
    app.addHook('onSend', async (request, reply, payload) => {
        if (request.method !== 'GET') return payload
        if (typeof payload !== 'string') return payload
        if (reply.statusCode !== 200) return payload

        const policy = request.routeOptions?.config?.cache
        if (!policy) return payload

        const etag = weakEtag(payload)
        reply.header('etag', etag)
        reply.header(
            'cache-control',
            `public, max-age=${policy.maxAge}, stale-while-revalidate=${policy.staleWhileRevalidate}`
        )

        if (request.headers['if-none-match'] === etag) {
            reply.code(304)
            return ''
        }

        return payload
    })
}
