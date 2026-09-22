import { createHmac, timingSafeEqual } from 'node:crypto'
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import type { AuthConfig, AuthSession, OAuthProvider, User } from '../contracts/index.js'
import { OAUTH_PROVIDERS } from '../contracts/index.js'
import { clearSessionCookie, readCookie, readSessionId, requireAuth, sessionContext, setSessionCookie } from '../auth.js'
import { emailKey, rateLimit } from '../http/rateLimit.js'
import { requireFeature } from '../features.js'
import { MagicLinkService } from '../services/MagicLinkService.js'
import { API_URL, DEV_LOGIN, WEB_URL } from '../env.js'
import { generatePKCE, generateState, verifyCallback } from '@toolcase/node'
import container from '../container.js'
import { AuthService } from '../services/AuthService.js'
import { FeatureService } from '../services/FeatureService.js'
import { SettingsService } from '../services/SettingsService.js'
import { ConflictError, ForbiddenError, NotFoundError, UnavailableError } from '../domain/errors.js'
import { recordRequestAudit } from '../audit.js'

const auth = () => container.resolve(AuthService)

const magicLinks = () => container.resolve(MagicLinkService)
const features = () => container.resolve(FeatureService)

const STATE_COOKIE = 'starter_oauth_state'

const FLOW_SECRET_KEY = 'oauth_flow_secret'

let flowSecretValue = ''

const flowSecret = (): string => flowSecretValue

const STATE_COOKIE_ATTRS = `Path=/api/auth; HttpOnly; SameSite=Lax${DEV_LOGIN ? '' : '; Secure'}`

const callbackUrl = (request: FastifyRequest, provider: OAuthProvider): string => {
    const origin = API_URL || `${request.protocol}://${request.hostname}`
    return `${origin}/api/auth/${provider}/callback`
}

const signFlow = (payload: string): string =>
    createHmac('sha256', flowSecret()).update(payload).digest('base64url')

const encodeFlowCookie = (flow: { state: string; verifier: string; link?: boolean }): string => {
    const payload = Buffer.from(JSON.stringify(flow)).toString('base64url')
    return `${payload}.${signFlow(payload)}`
}

const parseFlowCookie = (value: string | null): { state: string; verifier: string; link: boolean } | null => {
    if (!value) return null

    const separator = value.lastIndexOf('.')
    if (separator < 0) return null

    const payload = value.slice(0, separator)
    const signature = Buffer.from(value.slice(separator + 1))
    const expected = Buffer.from(signFlow(payload))
    if (signature.length !== expected.length || !timingSafeEqual(signature, expected)) return null

    try {
        const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString()) as {
            state?: string
            verifier?: string
            link?: boolean
        }
        return parsed.state && parsed.verifier
            ? { state: parsed.state, verifier: parsed.verifier, link: parsed.link === true }
            : null
    } catch {
        return null
    }
}

const providerParamsSchema = {
    type: 'object',
    required: ['provider'],
    additionalProperties: false,
    properties: {
        provider: { type: 'string', enum: [...OAUTH_PROVIDERS] },
    },
} as const

const magicLinkSchema = {
    type: 'object',
    required: ['email'],
    additionalProperties: false,
    properties: {
        email: { type: 'string', format: 'email', maxLength: 200 },
    },
} as const

const magicTokenSchema = {
    type: 'object',
    required: ['token'],
    additionalProperties: false,
    properties: {
        token: { type: 'string', minLength: 10, maxLength: 200 },
    },
} as const

const devLoginSchema = {
    type: 'object',
    required: ['email'],
    additionalProperties: false,
    properties: {
        email: { type: 'string', format: 'email', maxLength: 200 },
        name: { type: 'string', maxLength: 200 },
    },
} as const

type ProviderParams = { provider: OAuthProvider }

const authConfigEndpoint = async (): Promise<AuthConfig> => ({
    providers: auth().configuredProviders(),
    devLogin: DEV_LOGIN,
    features: await features().getFlags(),
})

const oauthAuthorizeEndpoint = async (
    request: FastifyRequest<{ Params: ProviderParams; Querystring: { link?: string } }>,
    reply: FastifyReply
) => {
    const provider = request.params.provider
    if (!auth().isConfigured(provider)) throw new UnavailableError('sso_not_configured')
    const link = request.query.link === '1'
    if (link && !request.user) return reply.redirect(`${WEB_URL}/login?error=unauthorized`)
    const state = generateState()
    const pkce = generatePKCE()
    const flow = encodeFlowCookie({ state, verifier: pkce.codeVerifier, ...(link ? { link: true } : {}) })
    reply.header('set-cookie', `${STATE_COOKIE}=${flow}; ${STATE_COOKIE_ATTRS}; Max-Age=600`)
    return reply.redirect(auth().authorizeUrl(provider, {
        state,
        codeChallenge: pkce.codeChallenge,
        codeChallengeMethod: pkce.method,
        redirectUri: callbackUrl(request, provider),
    }))
}

const oauthCallbackEndpoint = async (
    request: FastifyRequest<{
        Params: ProviderParams
        Querystring: { code?: string; state?: string; error?: string }
    }>,
    reply: FastifyReply
) => {
    const provider = request.params.provider
    if (!auth().isConfigured(provider)) throw new UnavailableError('sso_not_configured')
    reply.header('set-cookie', `${STATE_COOKIE}=; ${STATE_COOKIE_ATTRS}; Max-Age=0`)

    const flow = parseFlowCookie(readCookie(request, STATE_COOKIE))
    const fail = (code: string) =>
        reply.redirect(flow?.link
            ? `${WEB_URL}/profile?link_error=${code}`
            : `${WEB_URL}/login?error=${code}`)

    if (request.query.error) return fail('denied')
    if (!request.query.code || !request.query.state || !flow) {
        return fail('invalid_state')
    }

    try {
        verifyCallback({ stored: flow.state, received: request.query.state })
    } catch {
        return fail('invalid_state')
    }
    const profile = await auth().authenticate(provider, {
        code: request.query.code,
        redirectUri: callbackUrl(request, provider),
        codeVerifier: flow.verifier,
    })
    if (!profile) return fail('invalid_token')

    if (flow.link) {
        if (!request.user) return fail('unauthorized')
        try {
            await auth().linkIdentity(request.user.id, provider, profile)
        } catch (error) {
            return fail(error instanceof ConflictError ? error.code : 'link_failed')
        }
        void recordRequestAudit(request, 'link_identity', request.user.id, provider, request.user)
        return reply.redirect(`${WEB_URL}/profile?linked=${provider}`)
    }

    let user: User
    try {
        user = await auth().resolveOAuthUser(provider, profile)
    } catch (error) {
        return fail(error instanceof ConflictError ? error.code : 'sign_in_failed')
    }
    if (!user.active) return fail('deactivated')
    setSessionCookie(reply, await auth().createSession(user.id, sessionContext(request)))
    void recordRequestAudit(request, 'sign_in', user.id, provider, user)
    return reply.redirect(`${WEB_URL}/`)
}

const devLoginEndpoint = async (
    request: FastifyRequest<{ Body: { email: string; name?: string } }>,
    reply: FastifyReply
) => {
    if (!DEV_LOGIN) throw new NotFoundError('dev_login_disabled')
    const email = request.body.email.trim().toLowerCase()
    const user = await auth().resolveDevUser(email, request.body.name?.trim() || email.split('@')[0])
    if (!user.active) throw new ForbiddenError('account_deactivated')
    setSessionCookie(reply, await auth().createSession(user.id, sessionContext(request)))
    void recordRequestAudit(request, 'sign_in', user.id, 'dev', user)
    return user
}

const magicLinkRequestEndpoint = async (
    request: FastifyRequest<{ Body: { email: string } }>,
    reply: FastifyReply
) => {
    await magicLinks().request(request.body.email, request.ip)
    reply.code(202)
    return { sent: true }
}

const magicLinkConsumeEndpoint = async (
    request: FastifyRequest<{ Params: { token: string } }>,
    reply: FastifyReply
) => {
    const user = await magicLinks().consume(request.params.token)
    if (!user.active) throw new ForbiddenError('account_deactivated')
    setSessionCookie(reply, await auth().createSession(user.id, sessionContext(request)))
    void recordRequestAudit(request, 'sign_in', user.id, 'magic_link', user)
    return user
}

const meEndpoint = async (request: FastifyRequest): Promise<AuthSession> =>
    auth().sessionFor(request.user!, request.permissionSet, request.impersonatedBy)

const endImpersonationEndpoint = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<User> => {
    const sessionId = readSessionId(request)
    const { admin, sessionId: restored } = await auth().endImpersonation(
        request.user!,
        request.impersonatedBy,
        sessionId,
        sessionContext(request)
    )
    setSessionCookie(reply, restored)
    void recordRequestAudit(request, 'end_impersonation', request.user!.id, request.user!.email, admin)
    return admin
}

const logoutEndpoint = async (request: FastifyRequest, reply: FastifyReply) => {
    const sessionId = readSessionId(request)
    if (sessionId) await auth().logout(sessionId)
    if (request.user) void recordRequestAudit(request, 'sign_out', request.user.id, '', request.user)
    clearSessionCookie(reply)
    reply.code(204)
    return null
}

export const authRouter: FastifyPluginAsync = async (app) => {
    flowSecretValue = await container.resolve(SettingsService).getOrCreateSecret(FLOW_SECRET_KEY)

    app.get('/api/config', authConfigEndpoint)

    app.get<{ Params: ProviderParams; Querystring: { link?: string } }>(
        '/api/auth/:provider',
        { schema: { params: providerParamsSchema } },
        oauthAuthorizeEndpoint
    )

    app.get<{ Params: ProviderParams; Querystring: { code?: string; state?: string; error?: string } }>(
        '/api/auth/:provider/callback',
        { schema: { params: providerParamsSchema } },
        oauthCallbackEndpoint
    )

    app.post<{ Body: { email: string } }>(
        '/api/auth/magic-link',
        {
            schema: { body: magicLinkSchema },
            preHandler: [
                requireFeature('magic_link'),
                rateLimit({ name: 'magic_link_request', max: 5, windowSeconds: 900, by: emailKey }),
            ],
        },
        magicLinkRequestEndpoint
    )

    app.get<{ Params: { token: string } }>(
        '/api/auth/magic-link/:token',
        {
            schema: { params: magicTokenSchema },
            preHandler: [
                requireFeature('magic_link'),
                rateLimit({ name: 'magic_link_consume', max: 20, windowSeconds: 900 }),
            ],
        },
        magicLinkConsumeEndpoint
    )

    app.post<{ Body: { email: string; name?: string } }>(
        '/api/auth/dev',
        {
            schema: { body: devLoginSchema },
            preHandler: [rateLimit({ name: 'auth_dev', max: 10, windowSeconds: 300, by: emailKey })],
        },
        devLoginEndpoint
    )

    app.get('/api/auth/me', { preHandler: [requireAuth] }, meEndpoint)

    app.post('/api/auth/impersonation/end', { preHandler: [requireAuth] }, endImpersonationEndpoint)

    app.post('/api/auth/logout', logoutEndpoint)

}
