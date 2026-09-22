import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import type { FeatureFlags, PlatformSettings, User, UserRole } from '../contracts/index.js'
import { FEATURE_FLAGS } from '../contracts/index.js'
import { readSessionId, requireAuth, requirePermission, sessionContext, setSessionCookie } from '../auth.js'
import container from '../container.js'
import { UserService } from '../services/UserService.js'
import { AdminOverviewService } from '../services/AdminOverviewService.js'
import { SettingsService } from '../services/SettingsService.js'
import { FeatureService } from '../services/FeatureService.js'
import { recordRequestAudit } from '../audit.js'

const users = () => container.resolve(UserService)
const overview = () => container.resolve(AdminOverviewService)
const settings = () => container.resolve(SettingsService)
const features = () => container.resolve(FeatureService)

const userPatchSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        role: { type: 'string', minLength: 1, maxLength: 60 },
        active: { type: 'boolean' },

        verified: { type: 'boolean' },
    },
} as const

const userCreateSchema = {
    type: 'object',
    required: ['email'],
    additionalProperties: false,
    properties: {
        email: { type: 'string', format: 'email', maxLength: 200 },
        name: { type: 'string', maxLength: 200 },
        role: { type: 'string', minLength: 1, maxLength: 60 },
    },
} as const

const featureFlagsSchema = {
    type: 'object',
    additionalProperties: false,
    properties: Object.fromEntries(FEATURE_FLAGS.map((flag) => [flag, { type: 'boolean' }])),
} as const

const settingsSchema = {
    type: 'object',
    required: ['signupsOpen', 'announcement'],
    additionalProperties: false,
    properties: {
        signupsOpen: { type: 'boolean' },
        announcement: { type: 'string', maxLength: 2000 },
        salesContact: { type: 'string', maxLength: 300 },
    },
} as const

const featureFlagsEndpoint = async (): Promise<FeatureFlags> => features().getFlags()

const saveFeatureFlagsEndpoint = async (
    request: FastifyRequest<{ Body: Partial<FeatureFlags> }>
): Promise<FeatureFlags> => {
    const saved = await features().saveFlags(request.body)
    void recordRequestAudit(
        request,
        'update_feature_flags',
        '',
        FEATURE_FLAGS.map((flag) => `${flag}=${saved[flag]}`).join(' ')
    )
    return saved
}

const listUsersEndpoint = async () => users().list()

const userProfileEndpoint = async (
    request: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply
) => {
    return await users().profile(request.params.userId)
}

const createUserEndpoint = async (
    request: FastifyRequest<{ Body: { email: string; name?: string; role?: string } }>,
    reply: FastifyReply
) => {
    const created = await users().createProvisioned(request.user!, request.body)
    reply.code(201)
    return created
}

const impersonateEndpoint = async (
    request: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply
): Promise<User> => {
    const { target, sessionId } = await users().impersonate(
        request.user!,
        readSessionId(request),
        request.params.userId,
        sessionContext(request)
    )
    setSessionCookie(reply, sessionId)
    return target
}

const adminOverviewEndpoint = async () => overview().overview()

const getSettingsEndpoint = async (): Promise<PlatformSettings> => settings().getPlatformSettings()

const saveSettingsEndpoint = async (
    request: FastifyRequest<{ Body: PlatformSettings }>
): Promise<PlatformSettings> => {
    const saved = await settings().savePlatformSettings({
        ...request.body,
        salesContact: request.body.salesContact ?? '',
    })
    void recordRequestAudit(
        request,
        'update_settings',
        '',
        `signupsOpen=${saved.signupsOpen} announcement=${saved.announcement ? 'set' : 'empty'}`
    )
    return saved
}

const patchUserEndpoint = async (
    request: FastifyRequest<{ Params: { userId: string }; Body: { role?: UserRole; active?: boolean; verified?: boolean } }>,
    reply: FastifyReply
) => {
    return await users().update(request.user!, request.params.userId, request.body)
}

export const userRouter: FastifyPluginAsync = async (app) => {
    app.addHook('preHandler', requireAuth)

    app.get('/api/users', { preHandler: [requirePermission('admin.user.read')] }, listUsersEndpoint)

    app.post<{ Body: { email: string; name?: string; role?: string } }>(
        '/api/users',
        { schema: { body: userCreateSchema }, preHandler: [requirePermission('admin.user.role.write')] },
        createUserEndpoint
    )

    app.get<{ Params: { userId: string } }>(
        '/api/users/:userId/profile',
        { preHandler: [requirePermission('admin.user.read')] },
        userProfileEndpoint
    )

    app.post<{ Params: { userId: string } }>(
        '/api/users/:userId/impersonate',
        { preHandler: [requirePermission('admin.user.impersonate')] },
        impersonateEndpoint
    )

    app.get('/api/admin/overview', { preHandler: [requirePermission('admin.overview.read')] }, adminOverviewEndpoint)

    app.get('/api/settings', { preHandler: [requirePermission('admin.settings.read')] }, getSettingsEndpoint)

    app.put<{ Body: PlatformSettings }>(
        '/api/settings',
        { schema: { body: settingsSchema }, preHandler: [requirePermission('admin.settings.write')] },
        saveSettingsEndpoint
    )

    app.get('/api/settings/features', { preHandler: [requirePermission('admin.settings.read')] }, featureFlagsEndpoint)

    app.put<{ Body: Partial<FeatureFlags> }>(
        '/api/settings/features',
        { schema: { body: featureFlagsSchema }, preHandler: [requirePermission('admin.feature.write')] },
        saveFeatureFlagsEndpoint
    )

    app.patch<{ Params: { userId: string }; Body: { role?: UserRole; active?: boolean; verified?: boolean } }>(
        '/api/users/:userId',
        { schema: { body: userPatchSchema }, preHandler: [requirePermission('admin.user.role.write')] },
        patchUserEndpoint
    )

}
