import type { Permission } from './permissions.js'
import type { RoleBindings } from './roles.js'

export const LIMITABLE_RESOURCES = [
    'projects',
    'tasks',
] as const

export type LimitableResource = typeof LIMITABLE_RESOURCES[number]

export const RESOURCE_LABELS: Record<LimitableResource, string> = {
    projects: 'Projects',
    tasks: 'Tasks',
}

export type LimitMap = Partial<Record<LimitableResource, number | null>>

export type ResolvedLimits = Record<LimitableResource, number | null>

export type LimitUsage = {
    resource: LimitableResource
    used: number
    limit: number | null
    reached: boolean
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
