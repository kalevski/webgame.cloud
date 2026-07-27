import type { Permission } from './permissions.js'

export const OWNER_ROLE_ID = 'owner'

export type Role = {
    id: string
    name: string

    builtin: boolean

    position: number

    permissions: Permission[]
}

export type RoleDraft = {
    id?: string
    name: string
    permissions: Permission[]
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
    permissions: readonly Permission[]
}> = [
    {
        id: 'member',
        name: 'Member',
        position: 10,
        permissions: ['project.write', 'task.write', 'project.share', 'file.upload'],
    },
    {
        id: 'member_plus',
        name: 'Member Plus',
        position: 20,
        permissions: ['project.write', 'task.write', 'project.share', 'project.export', 'file.upload'],
    },
    {
        id: 'maintainer',
        name: 'Maintainer',
        position: 30,
        permissions: [
            'project.write', 'task.write', 'project.share',
            'moderation.queue.read', 'moderation.report.resolve', 'audit.read',
            'admin.overview.read', 'admin.user.read',
            'admin.role.read', 'admin.settings.read',
            'billing.plan.read', 'billing.subscription.read',
            'invoice.read', 'enquiry.read',
            'email.outbox.read',
            'signing.key.read',
        ],
    },
]

export const SEED_ROLE_BINDINGS: RoleBindings = {
    default: 'member',
}

export const toRoleId = (raw: string): string =>
    raw
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 60)
