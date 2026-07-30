import type { Permission } from './permissions.js'
import type { RoleBindings } from './roles.js'

export const ACCOUNT_LIMITED = [
    'projects',
    'storage_mb',
] as const

export const PROJECT_LIMITED = [
    'bundles_per_project',
    'configs_per_project',
    'members_per_project',
] as const

export const LIMITABLE_RESOURCES = [...ACCOUNT_LIMITED, ...PROJECT_LIMITED] as const

export type AccountLimitedResource = typeof ACCOUNT_LIMITED[number]
export type ProjectLimitedResource = typeof PROJECT_LIMITED[number]
export type LimitableResource = typeof LIMITABLE_RESOURCES[number]

export const RESOURCE_LABELS: Record<LimitableResource, string> = {
    projects: 'Projects',
    storage_mb: 'Storage',
    bundles_per_project: 'Bundles per project',
    configs_per_project: 'Configs per project',
    members_per_project: 'Members per project',
}

export const BYTES_PER_MB = 1_048_576

export type LimitMap = Partial<Record<LimitableResource, number | null>>

export type ResolvedLimits = Record<AccountLimitedResource, number | null>

export type LimitUsage = {
    resource: LimitableResource
    used: number
    limit: number | null
    reached: boolean
}

export type ProjectLimitUsage = LimitUsage & { projectId: string }

export type StorageVerdict = 'ok' | 'grace' | 'blocked'

export const USAGE_WARN_RATIO = 0.9

export type StorageStatus = {
    usedBytes: number
    limitBytes: number | null
    graceBytes: number | null
    verdict: StorageVerdict
    overageAllowed: boolean
}

export type PermissionDelta = Partial<Record<Permission, boolean>>

export type AccessPolicy = {
    roles: Record<string, Permission[]>
    roleLimits: Record<string, LimitMap>

    bindings: RoleBindings
}

export type UserAccessOverrides = {
    permissions: PermissionDelta
    limits: LimitMap
}

export type AccessPolicyPayload = AccessPolicy

export type UserAccessPayload = UserAccessOverrides & {
    usage?: LimitUsage[]
}

export type AccountUsage = {
    usage: LimitUsage[]
    storage: StorageStatus
}
