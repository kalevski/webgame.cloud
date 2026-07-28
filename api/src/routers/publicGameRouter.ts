import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import { encodeErrorCause } from '../contracts/index.js'
import container from '../container.js'
import { BuildService } from '../services/BuildService.js'
import { ConfigService } from '../services/ConfigService.js'
import { cached, publicRateLimit } from '../http/publicRateLimit.js'

const builds = () => container.resolve(BuildService)
const configs = () => container.resolve(ConfigService)

const BARE = { config: { envelope: false }, preHandler: [publicRateLimit] }

const CONFIG_CACHE = 'public, max-age=0, s-maxage=30, stale-while-revalidate=60'

const assetsEndpoint = async (
    request: FastifyRequest<{ Params: { id: string }; Querystring: { buildId?: string; buildTag?: string } }>,
    reply: FastifyReply
) => {
    const { buildId, buildTag } = request.query
    try {
        const manifest = await cached(
            `manifest:${request.params.id}:${buildId ?? ''}:${buildTag ?? ''}`,
            () => builds().manifest(request.params.id, buildId ?? null, buildTag ?? '')
        )
        reply.header('cache-control', buildId
            ? 'public, max-age=31536000, immutable'
            : 'public, max-age=60')
        return manifest
    } catch {
        reply.code(404)
        return { error: encodeErrorCause('build_not_found') }
    }
}

const configEndpoint = async (
    request: FastifyRequest<{ Params: { id: string; key: string }; Querystring: { buildTag?: string } }>,
    reply: FastifyReply
) => {
    const buildTag = request.query.buildTag ?? ''
    const found = await cached(
        `config:${request.params.id}:${request.params.key}:${buildTag}`,
        () => configs().publicRead(request.params.id, [request.params.key], buildTag)
    )
    if (found.length === 0) {
        reply.code(404)
        return { error: encodeErrorCause('config_not_found') }
    }
    reply.header('cache-control', CONFIG_CACHE)
    return found[0]
}

const configsEndpoint = async (
    request: FastifyRequest<{ Params: { id: string }; Querystring: { keys?: string; buildTag?: string } }>,
    reply: FastifyReply
) => {
    const keys = (request.query.keys ?? '').split(',').map((key) => key.trim()).filter(Boolean).slice(0, 25)
    if (keys.length === 0) {
        reply.code(400)
        return { error: encodeErrorCause('invalid_body', 'keys') }
    }
    const buildTag = request.query.buildTag ?? ''
    const found = await cached(
        `configs:${request.params.id}:${keys.join(',')}:${buildTag}`,
        () => configs().publicRead(request.params.id, keys, buildTag)
    )
    reply.header('cache-control', CONFIG_CACHE)
    return found
}

export const publicGameRouter: FastifyPluginAsync = async (app) => {
    app.get<{ Params: { id: string }; Querystring: { buildId?: string; buildTag?: string } }>(
        '/api/public/projects/:id/assets',
        BARE,
        assetsEndpoint
    )

    app.get<{ Params: { id: string }; Querystring: { keys?: string; buildTag?: string } }>(
        '/api/public/projects/:id/configs',
        BARE,
        configsEndpoint
    )

    app.get<{ Params: { id: string; key: string }; Querystring: { buildTag?: string } }>(
        '/api/public/projects/:id/configs/:key',
        BARE,
        configEndpoint
    )
}
