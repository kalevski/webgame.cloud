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
import { OAUTH_PROVIDERS, PERMISSIONS, encodeErrorCause } from '../contracts/index.js'
import { clearSessionCookie, readSessionId, requireAuth } from '../auth.js'
import container from '../container.js'
import { AccountService } from '../services/AccountService.js'
import { recordRequestAudit } from '../audit.js'

import { ApiKeyService } from '../services/ApiKeyService.js'
import { ForbiddenError } from '../domain/errors.js'

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

const consentEndpoint = async (request: FastifyRequest, reply: FastifyReply): Promise<User> => {
    if (request.impersonatedBy !== null) {
        throw new ForbiddenError('consent_while_impersonating')
    }
    const consented = await account().consent(request.user!.id)
    void recordRequestAudit(request, 'accept_consent', consented.id, '', consented)
    return consented
}

const renameAccountEndpoint = async (
    request: FastifyRequest<{ Body: { name: string } }>,
    reply: FastifyReply
): Promise<User> => {
    const renamed = await account().rename(request.user!.id, request.body.name)
    void recordRequestAudit(request, 'rename_account', renamed.id, renamed.name, renamed)
    return renamed
}

const listIdentitiesEndpoint = async (request: FastifyRequest): Promise<UserIdentity[]> =>
    account().listIdentities(request.user!.id)

const unlinkIdentityEndpoint = async (
    request: FastifyRequest<{ Params: { provider: OAuthProvider } }>,
    reply: FastifyReply
) => {
    await account().unlinkIdentity(request.user!.id, request.params.provider)
    void recordRequestAudit(request, 'unlink_identity', request.user!.id, request.params.provider)
    reply.code(204)
    return null
}

const listSessionsEndpoint = async (request: FastifyRequest): Promise<UserSession[]> =>
    account().listSessions(request.user!.id, readSessionId(request))

const revokeSessionEndpoint = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) => {
    await account().revokeSession(request.user!.id, request.params.id, readSessionId(request))
    void recordRequestAudit(request, 'revoke_session', request.user!.id, request.params.id)
    reply.code(204)
    return null
}

const exportAccountEndpoint = async (request: FastifyRequest, reply: FastifyReply): Promise<AccountExport | null> => {
    const data = await account().exportData(request.user!.id)
    void recordRequestAudit(request, 'export_account', request.user!.id)
    reply.header('content-disposition', `attachment; filename="account-export-${request.user!.id}.json"`)
    return data
}

const deleteAccountEndpoint = async (request: FastifyRequest, reply: FastifyReply) => {
    await account().deleteAccount(request.user!)
    void recordRequestAudit(request, 'delete_account', request.user!.id, request.user!.email)
    clearSessionCookie(reply)
    reply.code(204)
    return null
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
): Promise<ApiKeyIssued> => {
    const issued = await apiKeys().create(request.user!.id, request.body)
    void recordRequestAudit(request, 'create_api_key', issued.key.id, issued.key.name)
    reply.code(201)
    return issued
}

const revokeApiKeyEndpoint = async (
    request: FastifyRequest<{ Params: { keyId: string } }>,
    reply: FastifyReply
): Promise<null> => {
    await apiKeys().revoke(request.user!.id, request.params.keyId)
    void recordRequestAudit(request, 'revoke_api_key', request.params.keyId, '')
    reply.code(204)
    return null
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
