import type { AdminProject, Project } from './projects.js'
import type { Permission, UserRole } from './permissions.js'
import type { LimitUsage, ResolvedLimits } from './limits.js'
import type { RoleSlot } from './roles.js'
import type { FeatureFlags } from './features.js'
import type { AuditEntry } from './notifications.js'

export type { UserRole }

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

export const USER_KINDS = [
    'human',
    'service',
] as const

export type UserKind = typeof USER_KINDS[number]

export type User = {
    id: string
    email: string
    name: string
    picture: string
    role: UserRole

    kind: UserKind

    active: boolean

    verified: boolean

    consentedAt: string | null
    createdAt: string
}

export type Impersonator = {
    id: string
    name: string
    email: string
}

export type AuthSession = {
    user: User
    permissions: Permission[]

    resourceLimits: ResolvedLimits

    usage: LimitUsage[]

    slots: Record<RoleSlot | 'owner', boolean>

    roleName: string | null

    impersonatedBy: Impersonator | null

    paid: boolean

    upgradePlanName: string | null
}

export type AccountExport = {
    exportedAt: string
    user: User
    identities: UserIdentity[]
    projects: Project[]
    memberships: Array<{ projectId: string; projectName: string; permissions: string[]; joinedAt: string }>
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

export type ServiceAccount = {
    id: string

    name: string

    role: UserRole

    active: boolean

    keyCount: number

    lastUsedAt: string | null

    createdAt: string
}

export type ServiceAccountDraft = {
    name: string

    role?: UserRole
}

export type PlatformSettings = {
    signupsOpen: boolean

    announcement: string

    salesContact: string
}

export type AdminUserProject = AdminProject

export type AdminUserProfile = {
    user: User

    roleName: string

    permissions: Permission[]

    limits: ResolvedLimits

    usage: LimitUsage[]

    identities: UserIdentity[]

    sessionCount: number
    lastSeenAt: string | null

    projects: AdminUserProject[]

    storageBytes: number

    activity: AuditEntry[]
}

export type AdminOverview = {
    signupsTotal: number
    signupsLast30: number

    wau: number

    d30Retention: number | null
    projectsTotal: number
    projectsLast30: number
    buildsTotal: number

    reportQueue: { pending: number }

    signupsByWeek: Array<{ week: string; count: number }>

    projectsByAppType: Array<{ appType: string; count: number }>
    buildsByStatus: Array<{ status: string; count: number }>
    usersByRole: Array<{ role: string; name: string; count: number }>
}
