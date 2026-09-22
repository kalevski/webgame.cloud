import type { Permission } from './permissions.js'

export const OWNER_ROLE_ID = 'owner'

export type Role = {
    id: string
    name: string

    builtin: boolean

    position: number

    applicable: boolean
    applicationPrompt: string

    permissions: Permission[]
}

export type RoleDraft = {
    id?: string
    name: string
    permissions: Permission[]

    applicable?: boolean
    applicationPrompt?: string
}

export const ROLE_APPLICATION_STATUSES = [
    'pending',
    'approved',
    'rejected',
    'withdrawn',
] as const

export type RoleApplicationStatus = typeof ROLE_APPLICATION_STATUSES[number]

export const ROLE_APPLICATION_STATUS_LABELS: Record<RoleApplicationStatus, string> = {
    pending: 'Pending review',
    approved: 'Approved',
    rejected: 'Rejected',
    withdrawn: 'Withdrawn',
}

export type RoleApplication = {
    id: string

    roleId: string
    roleName: string

    userId: string
    userName: string
    userEmail: string

    status: RoleApplicationStatus

    message: string
    decisionNote: string

    decidedById: string | null
    decidedByName: string
    decidedAt: string | null

    createdAt: string
    updatedAt: string
}

export type RoleApplicationDraft = {
    roleId: string
    message?: string
}

export type RoleApplicationDecision = {
    approve: boolean
    note?: string
}

export type RoleApplicationFilters = {
    status?: RoleApplicationStatus
    roleId?: string

    q?: string

    limit?: number
    offset?: number
}

export type OpenRole = {
    id: string
    name: string
    applicationPrompt: string
}

export const ROLE_SLOTS = [

    'default',
] as const

export type RoleSlot = typeof ROLE_SLOTS[number]

export const ROLE_SLOT_LABELS: Record<RoleSlot, { label: string; hint: string }> = {
    default: {
        label: 'Default role',
        hint: 'The role every new account is given at sign-up.',
    },
}

export type RoleBindings = Record<RoleSlot, string | null>

export const SEED_ROLES: ReadonlyArray<{
    id: string
    name: string
    position: number
    applicable: boolean
    applicationPrompt: string
    permissions: readonly Permission[]
}> = [
    {
        id: 'indie',
        name: 'Indie',
        position: 10,
        applicable: false,
        applicationPrompt: '',
        permissions: ['project.create', 'file.upload', 'ticket.create'],
    },
    {
        id: 'indie_plus',
        name: 'Indie Plus',
        position: 20,
        applicable: false,
        applicationPrompt: '',
        permissions: ['project.create', 'file.upload', 'ticket.create'],
    },
    {
        id: 'studio',
        name: 'Studio',
        position: 30,
        applicable: false,
        applicationPrompt: '',
        permissions: ['project.create', 'file.upload', 'ticket.create'],
    },
    {
        id: 'maintainer',
        name: 'Maintainer',
        position: 40,
        applicable: false,
        applicationPrompt: '',
        permissions: [
            'project.create',
            'moderation.queue.read', 'moderation.report.resolve', 'audit.read',
            'role.application.read', 'role.application.write',
            'admin.overview.read', 'admin.user.read',
            'admin.role.read', 'admin.settings.read', 'admin.service.read',
            'billing.plan.read', 'billing.subscription.read',
            'invoice.read', 'enquiry.read',
            'email.outbox.read',
            'signing.key.read',
            'ticket.create', 'ticket.queue.read', 'ticket.queue.write',
        ],
    },
]

export const SEED_ROLE_BINDINGS: RoleBindings = {
    default: 'indie',
}

export const toRoleId = (raw: string): string =>
    raw
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 60)
