import type { ProjectPermission } from './projectAccess.js'

export const APP_TYPES = ['game', 'app', 'prototype'] as const

export type AppType = typeof APP_TYPES[number]

export type NamedRow = {
    id: string
    name: string
}

export type Project = {
    id: string
    ownerId: string
    realmId: string | null

    name: string
    description: string
    appType: AppType
    genre: string

    icon: string
    color: string

    defaultCategoryId: string | null
    archivedAt: string | null

    memberCount: number
    assetCount: number

    permissions: ProjectPermission[]
    isOwner: boolean

    createdAt: string
    updatedAt: string
}

export type ProjectDraft = {
    name: string
    description?: string
    appType?: AppType
    genre?: string
    icon?: string
    color?: string

    categories?: string[]
    tags?: string[]
    buildTags?: string[]
}

export type ProjectMember = {
    id: string
    userId: string
    name: string
    email: string
    avatarUrl: string
    permissions: ProjectPermission[]
    isOwner: boolean
    createdAt: string
}

export type ProjectInvite = {
    id: string
    projectId: string
    projectName: string
    email: string
    userId: string | null
    permissions: ProjectPermission[]
    invitedBy: string
    expiresAt: string
    createdAt: string
}

export type InviteDraft = {
    email?: string
    username?: string
    permissions: ProjectPermission[]
}

export const ADMIN_PROJECT_STATES = ['active', 'archived', 'all'] as const

export type AdminProjectState = typeof ADMIN_PROJECT_STATES[number]

export const ADMIN_PROJECT_SORTS = ['name', 'owner', 'members', 'assets', 'storage', 'created'] as const

export type AdminProjectSort = typeof ADMIN_PROJECT_SORTS[number]

export type AdminProject = {
    id: string
    name: string
    description: string
    appType: AppType

    icon: string
    color: string

    ownerId: string
    ownerName: string
    ownerEmail: string

    realmId: string | null
    realmName: string

    memberCount: number
    assetCount: number
    buildCount: number
    storageBytes: number

    archivedAt: string | null
    locked: boolean

    createdAt: string
    updatedAt: string
}

export type AdminProjectFilters = {
    q?: string
    appType?: AppType
    realmId?: string
    state?: AdminProjectState

    sort?: AdminProjectSort
    direction?: 'asc' | 'desc'

    limit?: number
    offset?: number
}

export type AdminProjectPage = {
    projects: AdminProject[]
    total: number
}

export type AdminProjectMember = {
    id: string
    userId: string

    name: string
    email: string
    avatarUrl: string

    verified: boolean
    active: boolean

    roleId: string
    roleName: string

    permissions: ProjectPermission[]
    isOwner: boolean

    joinedAt: string
}

export type ProjectCategoriesAndTags = {
    categories: NamedRow[]
    tags: NamedRow[]
    buildTags: NamedRow[]
}

export type CategoriesAndTagsDraft = {
    categories: string[]
    tags: string[]
    buildTags: string[]
    defaultCategoryId?: string | null
}
