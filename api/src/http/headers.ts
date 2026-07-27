import type { FastifyInstance } from 'fastify'
import { CORS_ORIGIN, DEV_LOGIN } from '../env.js'

const CSP_PRODUCTION = [
    "default-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'none'",
    "form-action 'none'",
].join('; ')

const CSP_DEVELOPMENT = [
    "default-src 'self'",
    "connect-src 'self' ws: http://localhost:* http://127.0.0.1:*",
    "img-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "frame-ancestors 'none'",
    "base-uri 'none'",
].join('; ')

export const registerSecurityHeaders = (app: FastifyInstance): void => {
    const csp = DEV_LOGIN ? CSP_DEVELOPMENT : CSP_PRODUCTION

    app.addHook('onSend', async (request, reply, payload) => {
        reply.header('x-content-type-options', 'nosniff')
        reply.header('x-frame-options', 'DENY')
        reply.header('referrer-policy', 'no-referrer')
        reply.header('cross-origin-opener-policy', 'same-origin')
        reply.header('cross-origin-resource-policy', CORS_ORIGIN ? 'cross-origin' : 'same-origin')
        reply.header('permissions-policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()')
        reply.header('content-security-policy', csp)
        reply.header('x-request-id', request.id)

        if (request.protocol === 'https') {
            reply.header('strict-transport-security', 'max-age=31536000; includeSubDomains')
        }

        return payload
    })
}
