import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import type {
    AccountExport,
    ApiKey,
    ApiKeyDraft,
    ApiKeyIssued,
    OAuthProvider,
    User,
    UserIdentity,
    UserSession,
} from '../contracts/index.js'
import { OAUTH_PROVIDERS, PERMISSIONS } from '../contracts/index.js'
import { clearSessionCookie, readSessionId, requireAuth } from '../auth.js'
import container from '../container.js'
import { AccountService } from '../services/AccountService.js'
import { sendError } from './sendError.js'
import { recordAudit } from '../audit.js'

import { ApiKeyService } from '../services/ApiKeyService.js'

const account = () => container.resolve(AccountService)

const apiKeys = () => container.resolve(ApiKeyService)

const nameSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['name'],
    properties: { name: { type: 'string', minLength: 1, maxLength: 200 } },
} as const

const identityParamsSchema = {
    type: 'object',
    required: ['provider'],
    additionalProperties: false,
    properties: {
        provider: { type: 'string', enum: [...OAUTH_PROVIDERS] },
    },
} as const

const sessionParamsSchema = {
    type: 'object',
    required: ['id'],
    additionalProperties: false,
    properties: {
        id: { type: 'string', minLength: 1, maxLength: 64 },
    },
} as const

const consentEndpoint = async (request: FastifyRequest, reply: FastifyReply): Promise<User | { error: string }> => {
    try {
        const consented = await account().consent(request.user!.id)
        void recordAudit(consented, 'accept_consent', consented.id)
        return consented
    } catch (error) {
        return sendError(reply, error)
    }
}

const renameAccountEndpoint = async (
    request: FastifyRequest<{ Body: { name: string } }>,
    reply: FastifyReply
): Promise<User | { error: string }> => {
    try {
        const renamed = await account().rename(request.user!.id, request.body.name)
        void recordAudit(renamed, 'rename_account', renamed.id, renamed.name)
        return renamed
    } catch (error) {
        return sendError(reply, error)
    }
}

const listIdentitiesEndpoint = async (request: FastifyRequest): Promise<UserIdentity[]> =>
    account().listIdentities(request.user!.id)

const unlinkIdentityEndpoint = async (
    request: FastifyRequest<{ Params: { provider: OAuthProvider } }>,
    reply: FastifyReply
) => {
    try {
        await account().unlinkIdentity(request.user!.id, request.params.provider)
        void recordAudit(request.user!, 'unlink_identity', request.user!.id, request.params.provider)
        reply.code(204)
        return null
    } catch (error) {
        return sendError(reply, error)
    }
}

const listSessionsEndpoint = async (request: FastifyRequest): Promise<UserSession[]> =>
    account().listSessions(request.user!.id, readSessionId(request))

const revokeSessionEndpoint = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) => {
    try {
        await account().revokeSession(request.user!.id, request.params.id, readSessionId(request))
        void recordAudit(request.user!, 'revoke_session', request.user!.id, request.params.id)
        reply.code(204)
        return null
    } catch (error) {
        return sendError(reply, error)
    }
}

const exportAccountEndpoint = async (request: FastifyRequest, reply: FastifyReply): Promise<AccountExport | null> => {
    const data = await account().exportData(request.user!.id)
    void recordAudit(request.user!, 'export_account', request.user!.id)
    reply.header('content-disposition', `attachment; filename="account-export-${request.user!.id}.json"`)
    return data
}

const deleteAccountEndpoint = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        await account().deleteAccount(request.user!)
        void recordAudit(request.user!, 'delete_account', request.user!.id, request.user!.email)
        clearSessionCookie(reply)
        reply.code(204)
        return null
    } catch (error) {
        return sendError(reply, error)
    }
}

const apiKeySchema = {
    type: 'object',
    required: ['name'],
    additionalProperties: false,
    properties: {
        name: { type: 'string', minLength: 1, maxLength: 80 },
        scopes: { type: 'array', maxItems: 100, items: { type: 'string', enum: [...PERMISSIONS] } },
        expiresAt: { type: ['string', 'null'], maxLength: 40 },
    },
} as const

const listApiKeysEndpoint = async (request: FastifyRequest): Promise<ApiKey[]> =>
    apiKeys().list(request.user!.id)

const createApiKeyEndpoint = async (
    request: FastifyRequest<{ Body: ApiKeyDraft }>,
    reply: FastifyReply
): Promise<ApiKeyIssued | { error: string }> => {
    try {
        const issued = await apiKeys().create(request.user!.id, request.body)
        void recordAudit(request.user!, 'create_api_key', issued.key.id, issued.key.name, request.id)
        reply.code(201)
        return issued
    } catch (error) {
        return sendError(reply, error)
    }
}

const revokeApiKeyEndpoint = async (
    request: FastifyRequest<{ Params: { keyId: string } }>,
    reply: FastifyReply
): Promise<null | { error: string }> => {
    try {
        await apiKeys().revoke(request.user!.id, request.params.keyId)
        void recordAudit(request.user!, 'revoke_api_key', request.params.keyId, '', request.id)
        reply.code(204)
        return null
    } catch (error) {
        return sendError(reply, error)
    }
}

export const accountRouter: FastifyPluginAsync = async (app) => {
    app.addHook('preHandler', requireAuth)

    app.post('/api/account/consent', consentEndpoint)

    app.put<{ Body: { name: string } }>(
        '/api/account/name',
        { schema: { body: nameSchema } },
        renameAccountEndpoint
    )

    app.get('/api/account/identities', listIdentitiesEndpoint)

    app.delete<{ Params: { provider: OAuthProvider } }>(
        '/api/account/identities/:provider',
        { schema: { params: identityParamsSchema } },
        unlinkIdentityEndpoint
    )

    app.get('/api/account/sessions', listSessionsEndpoint)

    app.delete<{ Params: { id: string } }>(
        '/api/account/sessions/:id',
        { schema: { params: sessionParamsSchema } },
        revokeSessionEndpoint
    )

    app.get('/api/account/api-keys', listApiKeysEndpoint)

    app.post<{ Body: ApiKeyDraft }>(
        '/api/account/api-keys',
        { schema: { body: apiKeySchema } },
        createApiKeyEndpoint
    )

    app.delete<{ Params: { keyId: string } }>('/api/account/api-keys/:keyId', revokeApiKeyEndpoint)

    app.get('/api/account/export', exportAccountEndpoint)

    app.delete('/api/account', deleteAccountEndpoint)

}
