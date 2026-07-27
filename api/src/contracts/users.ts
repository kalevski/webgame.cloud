import type { Project, Task } from './projects.js'
import type { Permission, UserRole } from './permissions.js'
import type { LimitUsage, ResolvedLimits } from './limits.js'
import type { RoleSlot } from './roles.js'
import type { FeatureFlags } from './features.js'

export type { UserRole }

export type ApiError = {
    error: string
}

export const OAUTH_PROVIDERS = [
    'google',
    'discord',
] as const

export type OAuthProvider = typeof OAUTH_PROVIDERS[number]

export const OAUTH_PROVIDER_LABELS: Record<OAuthProvider, string> = {
    google: 'Google',
    discord: 'Discord',
}

export type UserIdentity = {
    provider: OAuthProvider
    email: string
    createdAt: string
}

export type UserSession = {
    id: string

    current: boolean

    browser: string
    os: string
    ip: string
    createdAt: string
    lastSeenAt: string
    expiresAt: string
}

export type User = {
    id: string
    email: string
    name: string
    picture: string
    role: UserRole

    active: boolean

    verified: boolean

    consentedAt: string | null
    createdAt: string
}

export type Limits = {
    projects: number | null
    tasks: number | null
}

export type AuthSession = {
    user: User
    permissions: Permission[]

    limits: Limits

    resourceLimits: ResolvedLimits

    usage: LimitUsage[]

    slots: Record<RoleSlot | 'owner', boolean>

    roleName: string | null

    paid: boolean

    upgradePlanName: string | null
}

export type AccountExport = {
    exportedAt: string
    user: User
    identities: UserIdentity[]
    projects: Project[]
    tasks: Task[]
}

export type AuthConfig = {
    providers: OAuthProvider[]

    devLogin: boolean

    features: FeatureFlags
}

export type ApiKey = {
    id: string

    name: string

    prefix: string

    scopes: string[]

    lastUsedAt: string | null
    expiresAt: string | null

    createdAt: string
}

export type ApiKeyDraft = {
    name: string

    scopes?: string[]

    expiresAt?: string | null
}

export type ApiKeyIssued = {
    key: ApiKey

    token: string
}

export type PlatformSettings = {
    signupsOpen: boolean

    announcement: string

    salesContact: string
}

export type AdminOverview = {
    signupsTotal: number
    signupsLast30: number

    wau: number

    d30Retention: number | null
    projectsTotal: number
    projectsLast30: number
    tasksTotal: number

    reportQueue: { pending: number }

    signupsByWeek: Array<{ week: string; count: number }>

    projectsByVisibility: Array<{ visibility: string; count: number }>
    tasksByStatus: Array<{ status: string; count: number }>
    usersByRole: Array<{ role: string; name: string; count: number }>
}
