import type {
    AppType,
    NamedRow,
    Project,
    ProjectInvite,
    ProjectMember,
    ProjectPermission,
} from '../contracts/index.js'

export type ProjectRow = {
    id: string
    owner_id: string
    realm_id: string | null
    name: string
    description: string
    app_type: AppType
    icon: string
    color: string
    default_category_id: string
    archived_at: Date | null
    member_count?: string
    asset_count?: string
    caller_permissions?: string[] | null
    created_at: Date
    updated_at: Date
}

export type ProjectMemberRow = {
    id: string
    project_id: string
    user_id: string
    permissions: string[]
    name?: string
    email?: string
    picture?: string
    created_at: Date
}

export type ProjectInviteRow = {
    id: string
    project_id: string
    project_name?: string
    email: string
    user_id: string | null
    permissions: string[]
    invited_by: string | null
    inviter_name?: string
    expires_at: Date
    accepted_at: Date | null
    created_at: Date
}

export type NamedProjectRow = {
    id: string
    project_id: string
    name: string
}

export const toProject = (
    row: ProjectRow,
    permissions: ProjectPermission[],
    isOwner: boolean
): Project => ({
    id: row.id,
    ownerId: row.owner_id,
    realmId: row.realm_id,
    name: row.name,
    description: row.description,
    appType: row.app_type,
    icon: row.icon,
    color: row.color,
    defaultCategoryId: row.default_category_id || null,
    archivedAt: row.archived_at?.toISOString() ?? null,
    memberCount: Number(row.member_count ?? 0),
    assetCount: Number(row.asset_count ?? 0),
    permissions,
    isOwner,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
})

export const toMember = (row: ProjectMemberRow, ownerId: string): ProjectMember => ({
    id: row.id,
    userId: row.user_id,
    name: row.name ?? '',
    email: row.email ?? '',
    avatarUrl: row.picture ?? '',
    permissions: (row.permissions ?? []) as ProjectPermission[],
    isOwner: row.user_id === ownerId,
    createdAt: row.created_at.toISOString(),
})

export const toInvite = (row: ProjectInviteRow): ProjectInvite => ({
    id: row.id,
    projectId: row.project_id,
    projectName: row.project_name ?? '',
    email: row.email,
    userId: row.user_id,
    permissions: (row.permissions ?? []) as ProjectPermission[],
    invitedBy: row.inviter_name ?? '',
    expiresAt: row.expires_at.toISOString(),
    createdAt: row.created_at.toISOString(),
})

export const toNamed = (row: NamedProjectRow): NamedRow => ({ id: row.id, name: row.name })
