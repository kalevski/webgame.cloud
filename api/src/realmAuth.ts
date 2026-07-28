import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { encodeErrorCause } from './contracts/index.js'
import container from './container.js'
import { RealmService } from './services/RealmService.js'
import type { RealmRow } from './schema/realms.js'

declare module 'fastify' {
    interface FastifyRequest {
        realm: RealmRow | null
    }
}

export const REALM_ROUTE_PREFIXES = ['/api/realm', '/api/internal']

const readBearer = (request: FastifyRequest): string => {
    const header = request.headers.authorization
    if (!header?.startsWith('Bearer ')) return ''
    return header.slice(7).trim()
}

export const registerRealmAuth = (app: FastifyInstance): void => {
    app.decorateRequest('realm', null)
}

export const requireRealm = async (request: FastifyRequest, reply: FastifyReply) => {
    const token = readBearer(request)
    if (!token) {
        reply.code(401).send({ error: encodeErrorCause('unauthorized') })
        return reply
    }

    const realm = await container.resolve(RealmService).findByToken(token)
    if (!realm) {
        reply.code(401).send({ error: encodeErrorCause('unauthorized') })
        return reply
    }

    request.realm = realm
}
