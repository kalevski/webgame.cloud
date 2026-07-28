import type { ProjectPermission, User } from '../contracts/index.js'
import { OWNER_ROLE_ID, PROJECT_PERMISSIONS } from '../contracts/index.js'

const ALL: ReadonlySet<ProjectPermission> = new Set(PROJECT_PERMISSIONS)

export const resolveProjectPermissions = (
    user: User,
    project: { ownerId: string },
    membership?: { permissions: string[] } | null
): ReadonlySet<ProjectPermission> => {
    if (project.ownerId === user.id || user.role === OWNER_ROLE_ID) return ALL
    return new Set((membership?.permissions ?? []) as ProjectPermission[])
}

export const isSupportAccess = (user: User, project: { ownerId: string }): boolean =>
    user.role === OWNER_ROLE_ID && project.ownerId !== user.id

export const asProjectPermissions = (values: unknown): ProjectPermission[] => {
    if (!Array.isArray(values)) return []
    return values.filter((value): value is ProjectPermission =>
        (PROJECT_PERMISSIONS as readonly string[]).includes(value as string))
}
