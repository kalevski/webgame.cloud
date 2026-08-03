import type {
    AccessPolicy,
    LimitableResource,
    Limits,
    Permission,
    ResolvedLimits,
    Role,
    RoleBindings,
    RoleSlot,
    User,
    UserAccessOverrides,
} from '../contracts/index.js'
import { ACCOUNT_LIMITED, ACCOUNT_SHAPED, OWNER_ROLE_ID, PERMISSIONS } from '../contracts/index.js'
import { ForbiddenError } from './errors.js'

const EMPTY: ReadonlySet<Permission> = new Set()

const OWNER_GRANTS: ReadonlySet<Permission> = new Set(
    PERMISSIONS.filter((permission) => !(ACCOUNT_SHAPED as readonly string[]).includes(permission))
)

export const EMPTY_POLICY: AccessPolicy = { roles: {}, roleLimits: {}, bindings: {
    default: null,
} }
export const EMPTY_OVERRIDES: UserAccessOverrides = { permissions: {}, limits: {} }

export const resolvePermissions = (
    user: User,
    policy: AccessPolicy = EMPTY_POLICY,
    overrides: UserAccessOverrides = EMPTY_OVERRIDES
): ReadonlySet<Permission> => {
    if (!user.active) return EMPTY
    if (user.role === OWNER_ROLE_ID) return OWNER_GRANTS

    const granted = new Set<Permission>(policy.roles[user.role] ?? [])
    for (const [permission, allow] of Object.entries(overrides.permissions)) {
        if (allow) granted.add(permission as Permission)
        else granted.delete(permission as Permission)
    }
    return granted
}

const DEFAULT_UNLIMITED: ResolvedLimits = Object.fromEntries(
    ACCOUNT_LIMITED.map((resource) => [resource, null])
) as ResolvedLimits

export const INTERNAL_SOFT_CAPS: Record<LimitableResource, number> = {
    projects: 100,
    storage_mb: 1_048_576,
    tickets: 1_000,
    design_templates: 500,
    designs: 5_000,
    bundles_per_project: 1_000,
    configs_per_project: 10_000,
    members_per_project: 500,
}

export const resolveLimits = (
    user: User,
    policy: AccessPolicy = EMPTY_POLICY,
    overrides: UserAccessOverrides = EMPTY_OVERRIDES
): ResolvedLimits => {
    const limits: ResolvedLimits = { ...DEFAULT_UNLIMITED }
    const roleMap = policy.roleLimits[user.role] ?? {}
    for (const resource of ACCOUNT_LIMITED) {
        if (resource in roleMap) limits[resource] = roleMap[resource] ?? null
        if (resource in overrides.limits) limits[resource] = overrides.limits[resource] ?? null
    }
    return limits
}

export const resolveLimitFor = (
    resource: LimitableResource,
    roleId: string,
    policy: AccessPolicy = EMPTY_POLICY,
    overrides: UserAccessOverrides = EMPTY_OVERRIDES
): number | null => {
    const roleMap = policy.roleLimits[roleId] ?? {}
    if (resource in overrides.limits) return overrides.limits[resource] ?? null
    if (resource in roleMap) return roleMap[resource] ?? null
    return null
}

export const effectiveCeiling = (resource: LimitableResource, limit: number | null): number =>
    limit ?? INTERNAL_SOFT_CAPS[resource]

export const legacyLimits = (resolved: ResolvedLimits): Limits => ({
    projects: resolved.projects,
})

export const isInSlot = (role: string, slot: RoleSlot, bindings: RoleBindings): boolean =>
    bindings[slot] === role

export const rolesInSlot = (slot: RoleSlot, bindings: RoleBindings): string[] =>
    bindings[slot] === null ? [] : [bindings[slot] as string]

export const assertPermitted = (
    permissions: ReadonlySet<Permission>,
    permission: Permission
): void => {
    if (!permissions.has(permission)) {
        throw new ForbiddenError('forbidden', 'insufficient permissions')
    }
}

export const permissionsOfRole = (role: Role, policy: AccessPolicy): Permission[] =>
    role.id === OWNER_ROLE_ID ? [...OWNER_GRANTS] : [...(policy.roles[role.id] ?? [])]

export type { LimitableResource }
