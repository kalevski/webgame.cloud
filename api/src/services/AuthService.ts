import { inject, injectable } from 'tsyringe'
import type { AuthSession, OAuthProvider, Permission, User } from '../contracts/index.js'
import { ACTIVE_SUBSCRIPTION_STATUSES, OWNER_ROLE_ID } from '../contracts/index.js'
import {
    DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_SSO,
    GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_SSO,
} from '../env.js'
import { buildAuthorizeURL, defineOAuth2Provider, exchangeCode, fetchUserinfo } from '@toolcase/node'
import { Async } from '@toolcase/base'
import type { OAuth2ProviderConfig } from '@toolcase/node'
import { isInSlot, legacyLimits } from '../domain/access.js'
import { ConflictError } from '../domain/errors.js'
import { notify } from '../notify.js'
import { UserRepository } from '../repositories/users/UserRepository.js'
import { IdentityRepository } from '../repositories/users/IdentityRepository.js'
import { SessionRepository } from '../repositories/users/SessionRepository.js'
import type { SessionContext } from '../repositories/users/SessionRepository.js'
import { AccessPolicyService } from './AccessPolicyService.js'
import { BillingService } from './BillingService.js'
import { WaitlistService } from './WaitlistService.js'

export type OAuthProfile = { subject: string; email: string; name: string; picture: string }

const OAUTH_TIMEOUT_MS = 5_000

const WELCOME_TITLE = 'Welcome aboard — take a look around your workspace.'

const GOOGLE_SCOPE = ['openid', 'email', 'profile']
const DISCORD_SCOPE = ['identify', 'email']

type DiscordUser = {
    id: string
    username: string
    global_name?: string | null
    avatar?: string | null
    email?: string | null
    verified?: boolean
}

@injectable()
export class AuthService {
    constructor(
        @inject(UserRepository) private users: UserRepository,
        @inject(IdentityRepository) private identities: IdentityRepository,
        @inject(SessionRepository) private sessions: SessionRepository,
        @inject(AccessPolicyService) private access: AccessPolicyService,
        @inject(BillingService) private billing: BillingService,
        @inject(WaitlistService) private waitlist: WaitlistService
    ) {}

    private providers: Partial<Record<OAuthProvider, OAuth2ProviderConfig>> = {}

    private provider(id: OAuthProvider): OAuth2ProviderConfig {
        this.providers[id] ??= id === 'google'
            ? defineOAuth2Provider({
                id: 'google',
                authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
                tokenEndpoint: 'https://oauth2.googleapis.com/token',
                clientId: GOOGLE_CLIENT_ID,
                clientSecret: GOOGLE_CLIENT_SECRET,

                clientAuthMethod: 'client_secret_post',
            })
            : defineOAuth2Provider({
                id: 'discord',
                authorizationEndpoint: 'https://discord.com/oauth2/authorize',
                tokenEndpoint: 'https://discord.com/api/oauth2/token',
                userinfoEndpoint: 'https://discord.com/api/users/@me',
                clientId: DISCORD_CLIENT_ID,
                clientSecret: DISCORD_CLIENT_SECRET,

                clientAuthMethod: 'client_secret_post',
            })
        return this.providers[id]!
    }

    configuredProviders(): OAuthProvider[] {
        const configured: OAuthProvider[] = []
        if (GOOGLE_SSO) configured.push('google')
        if (DISCORD_SSO) configured.push('discord')
        return configured
    }

    isConfigured(id: OAuthProvider): boolean {
        return this.configuredProviders().includes(id)
    }

    authorizeUrl(id: OAuthProvider, input: {
        state: string
        codeChallenge: string
        codeChallengeMethod: 'S256' | 'plain'
        redirectUri: string
    }): string {
        return buildAuthorizeURL(this.provider(id), {
            ...input,
            scope: id === 'google' ? GOOGLE_SCOPE : DISCORD_SCOPE,
            ...(id === 'google' ? { prompt: 'select_account' } : {}),
        })
    }

    async authenticate(
        id: OAuthProvider,
        input: { code: string; redirectUri: string; codeVerifier: string }
    ): Promise<OAuthProfile | null> {
        const tokens = await exchangeCode(
            this.provider(id),
            input,
            { timeoutMs: OAUTH_TIMEOUT_MS, retry: false }
        ).catch(() => null)
        if (!tokens) return null
        if (id === 'google') {
            return tokens.idToken ? this.verifyGoogleToken(tokens.idToken) : null
        }
        return this.fetchDiscordProfile(tokens.accessToken)
    }

    private async verifyGoogleToken(credential: string): Promise<OAuthProfile | null> {
        const response = await Async.withTimeout(
            () => fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`),
            OAUTH_TIMEOUT_MS
        ).catch(() => null)
        if (!response || !response.ok) return null
        const payload = (await response.json()) as Record<string, string>
        if (payload.aud !== GOOGLE_CLIENT_ID) return null
        if (payload.email_verified !== 'true' || !payload.email) return null
        return {
            subject: payload.sub,
            email: payload.email,
            name: payload.name ?? payload.email,
            picture: payload.picture ?? '',
        }
    }

    private async fetchDiscordProfile(accessToken: string): Promise<OAuthProfile | null> {
        const payload = await Async.withTimeout(
            () => fetchUserinfo(this.provider('discord'), accessToken),
            OAUTH_TIMEOUT_MS
        ).catch(() => null) as DiscordUser | null
        if (!payload?.id || !payload.email || payload.verified !== true) return null
        return {
            subject: payload.id,
            email: payload.email,
            name: payload.global_name || payload.username || payload.email,
            picture: payload.avatar ? `https://cdn.discordapp.com/avatars/${payload.id}/${payload.avatar}.png` : '',
        }
    }

    async resolveOAuthUser(id: OAuthProvider, profile: OAuthProfile): Promise<User> {
        const byIdentity = await this.identities.findUserByIdentity(id, profile.subject)
        if (byIdentity) {
            await this.identities.link(byIdentity.id, id, profile.subject, profile.email)
            const touched = await this.users.touchProfile(byIdentity.id, {
                name: profile.name,
                picture: profile.picture,
            })
            return touched ?? byIdentity
        }

        const byEmail = await this.users.findByEmail(profile.email)
        if (byEmail?.kind === 'service') {
            throw new ConflictError('service_account_login', 'service accounts cannot sign in')
        }
        let user: User
        if (byEmail) {
            user = (await this.users.touchProfile(byEmail.id, {
                name: profile.name,
                picture: profile.picture,
            })) ?? byEmail
        } else {
            const bindings = await this.access.getBindings()
            user = await this.users.createWithAutoRole({
                email: profile.email,
                name: profile.name,
                picture: profile.picture,
                defaultRoleId: bindings.default ?? 'indie',
            })
            void notify(user.id, 'welcome', WELCOME_TITLE, '/dashboard')
        }
        await this.identities.link(user.id, id, profile.subject, profile.email)
        void this.waitlist.claimGrant(user).catch(() => undefined)
        return user
    }

    async resolveDevUser(email: string, name: string): Promise<User> {
        const existing = await this.users.findByEmail(email)
        if (existing?.kind === 'service') {
            throw new ConflictError('service_account_login', 'service accounts cannot sign in')
        }
        if (existing) {
            const touched = await this.users.touchProfile(existing.id, {
                name,
                picture: existing.picture,
            })
            const resolved = touched ?? existing
            void this.waitlist.claimGrant(resolved).catch(() => undefined)
            return resolved
        }
        const bindings = await this.access.getBindings()
        const created = await this.users.createWithAutoRole({
            email,
            name,
            picture: '',
            defaultRoleId: bindings.default ?? 'indie',
        })
        void notify(created.id, 'welcome', WELCOME_TITLE, '/dashboard')
        void this.waitlist.claimGrant(created).catch(() => undefined)
        return created
    }

    async linkIdentity(userId: string, id: OAuthProvider, profile: OAuthProfile): Promise<void> {
        const result = await this.identities.link(userId, id, profile.subject, profile.email)
        if (result.isErr()) {
            throw new ConflictError('identity_linked_elsewhere', 'identity already linked to another account')
        }
    }

    async createSession(userId: string, context: SessionContext): Promise<string> {
        return this.sessions.create(userId, context)
    }

    async logout(sessionId: string): Promise<void> {
        await this.sessions.delete(sessionId)
    }

    async sessionFor(user: User, permissionSet: ReadonlySet<Permission>): Promise<AuthSession> {
        const [resolved, bindings, roles, usage, subscription, plans] = await Promise.all([
            this.access.limitsFor(user),
            this.access.getBindings(),
            this.access.listRoles(),
            this.access.usageFor(user),
            this.billing.getSubscription(user.id),
            this.billing.listPlans(),
        ])

        const subscriptionActive = ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status)
        const upgradePlan = plans.find((plan) => plan.id !== subscription.planId) ?? null
        const nameOf = (roleId: string | null) =>
            roleId ? roles.find((role) => role.id === roleId)?.name ?? null : null
        return {
            user,

            permissions: [...permissionSet],
            limits: legacyLimits(resolved),
            resourceLimits: resolved,
            usage,
            slots: {
                owner: user.role === OWNER_ROLE_ID,
                default: isInSlot(user.role, 'default', bindings),
            },
            roleName: nameOf(user.role),
            paid: subscriptionActive,
            upgradePlanName: upgradePlan?.name ?? null,
        }
    }
}
