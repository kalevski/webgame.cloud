import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { CORS_ORIGIN, DEV_LOGIN } from './env.js'
import type { Permission, User } from './contracts/index.js'
import { encodeErrorCause } from './contracts/index.js'
import container from './container.js'
import { AccessPolicyService } from './services/AccessPolicyService.js'
import { ApiKeyService } from './services/ApiKeyService.js'
import { SessionRepository } from './repositories/users/SessionRepository.js'
import type { SessionContext } from './repositories/users/SessionRepository.js'
import { UserRepository } from './repositories/users/UserRepository.js'

declare module 'fastify' {
    interface FastifyRequest {
        user: User | null

        can(permission: Permission): boolean

        readonly permissionSet: ReadonlySet<Permission>

        resolvedPermissions: ReadonlySet<Permission> | null
    }
}

const EMPTY_PERMISSIONS: ReadonlySet<Permission> = new Set()

export const SESSION_COOKIE = 'starter_session'
const SESSION_MAX_AGE = 30 * 24 * 60 * 60

export const readCookie = (request: FastifyRequest, name: string): string | null => {
    const header = request.headers.cookie
    if (!header) return null
    for (const part of header.split(';')) {
        const separator = part.indexOf('=')
        if (separator < 0) continue
        if (part.slice(0, separator).trim() === name) {
            return part.slice(separator + 1).trim() || null
        }
    }
    return null
}

export const readSessionId = (request: FastifyRequest): string | null =>
    readCookie(request, SESSION_COOKIE)

export const sessionContext = (request: FastifyRequest): SessionContext => ({
    userAgent: request.headers['user-agent'] ?? '',
    ip: request.ip,
})

const COOKIE_ATTRS = CORS_ORIGIN ? 'SameSite=None; Secure' : `SameSite=Lax${DEV_LOGIN ? '' : '; Secure'}`

export const setSessionCookie = (reply: FastifyReply, sessionId: string): void => {
    reply.header(
        'set-cookie',
        `${SESSION_COOKIE}=${sessionId}; Path=/; HttpOnly; ${COOKIE_ATTRS}; Max-Age=${SESSION_MAX_AGE}`
    )
}

export const clearSessionCookie = (reply: FastifyReply): void => {
    reply.header('set-cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; ${COOKIE_ATTRS}; Max-Age=0`)
}

const readBearerToken = (request: FastifyRequest): string | undefined => {
    const header = request.headers.authorization
    if (!header?.startsWith('Bearer ')) return undefined
    return header.slice(7).trim() || undefined
}

export const registerAuth = (app: FastifyInstance): void => {
    app.decorateRequest('user', null)

    app.decorateRequest('resolvedPermissions', null)
    app.decorateRequest('permissionSet', {
        getter(this: FastifyRequest): ReadonlySet<Permission> {
            return this.resolvedPermissions ?? EMPTY_PERMISSIONS
        },
    })
    app.decorateRequest('can', function (this: FastifyRequest, permission: Permission): boolean {
        return this.permissionSet.has(permission)
    })
    app.addHook('onRequest', async (request) => {
        const bearer = readBearerToken(request)
        if (bearer) {
            const resolved = await container.resolve(ApiKeyService).resolve(bearer)
            if (!resolved) return

            request.user = resolved.user
            const full = await container.resolve(AccessPolicyService).permissionsFor(resolved.user)
            request.resolvedPermissions = resolved.scopes.length === 0
                ? full
                : new Set(resolved.scopes.filter((scope) => full.has(scope)))
            return
        }

        const sessionId = readSessionId(request)
        if (!sessionId) return
        request.user = await container.resolve(SessionRepository).findSessionUser(sessionId)
        if (!request.user) return

        request.resolvedPermissions = await container
            .resolve(AccessPolicyService)
            .permissionsFor(request.user)

        void container.resolve(UserRepository).touchLastSeen(request.user.id).catch(() => undefined)
        void container.resolve(SessionRepository).touch(sessionId).catch(() => undefined)
    })
}

export const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
        reply.code(401).send({ error: encodeErrorCause('unauthorized') })
        return reply
    }
}

export const requirePermission = (...permissions: Permission[]) =>
    async (request: FastifyRequest, reply: FastifyReply) => {
        if (!request.user) {
            reply.code(401).send({ error: encodeErrorCause('unauthorized') })
            return reply
        }
        if (!permissions.every((permission) => request.can(permission))) {
            reply.code(403).send({ error: encodeErrorCause('forbidden') })
            return reply
        }
    }
