import type { FastifyInstance } from 'fastify'
import { HTTP } from '@toolcase/base'
import { encodeErrorCause } from '../contracts/index.js'

declare module 'fastify' {
    interface FastifyContextConfig {
        envelope?: boolean
    }
}

type JsonBody = Record<string, unknown> | unknown[] | null

const isEnveloped = (value: unknown): boolean =>
    typeof value === 'object' && value !== null && !Array.isArray(value) &&
    'status' in (value as Record<string, unknown>) &&
    ('data' in (value as Record<string, unknown>) || 'cause' in (value as Record<string, unknown>))

const legacyError = (value: unknown): string | null => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
    const body = value as Record<string, unknown>
    if (typeof body.statusCode === 'number' && typeof body.message === 'string') return null
    return typeof body.error === 'string' ? body.error : null
}

export const registerEnvelope = (app: FastifyInstance): void => {
    app.addHook('preSerialization', async (request, reply, payload) => {
        const config = request.routeOptions?.config as { envelope?: boolean } | undefined
        if (config?.envelope === false) return payload

        const contentType = reply.getHeader('content-type')
        if (typeof contentType === 'string' && !contentType.includes('application/json')) return payload
        if (reply.statusCode === 204 || payload === undefined || payload === null) return payload
        if (typeof payload !== 'object') return payload
        if (isEnveloped(payload)) return payload

        if (reply.statusCode >= 400) {
            const cause = legacyError(payload)
                ?? encodeErrorCause(reply.statusCode === 404 ? 'not_found' : 'request_failed')
            return new HTTP.RESTError(reply.statusCode, cause).toJSON()
        }

        const body = payload as JsonBody
        const count = Array.isArray(body) ? body.length : null
        return new HTTP.RESTResponse(reply.statusCode, body, count).toJSON()
    })
}
