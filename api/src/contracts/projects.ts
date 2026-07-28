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

export type ProjectVocabularies = {
    categories: NamedRow[]
    tags: NamedRow[]
    buildTags: NamedRow[]
}

export type VocabulariesDraft = {
    categories: string[]
    tags: string[]
    buildTags: string[]
    defaultCategoryId?: string | null
}
