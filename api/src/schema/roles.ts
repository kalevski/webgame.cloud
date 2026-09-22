import type { RoleApplication, RoleApplicationStatus } from '../contracts/index.js'

export type RoleRow = {
    id: string
    name: string
    builtin: boolean
    position: number
    applicable: boolean
    application_prompt: string
}

export type RoleApplicationRow = {
    id: string
    user_id: string
    role_id: string
    status: RoleApplicationStatus
    message: string
    decision_note: string
    decided_by: string | null
    decided_at: Date | null
    created_at: Date
    updated_at: Date
    role_name: string
    user_name: string
    user_email: string
    decided_by_name: string | null
}

export const toRoleApplication = (row: RoleApplicationRow): RoleApplication => ({
    id: row.id,
    roleId: row.role_id,
    roleName: row.role_name ?? '',
    userId: row.user_id,
    userName: row.user_name ?? '',
    userEmail: row.user_email ?? '',
    status: row.status,
    message: row.message,
    decisionNote: row.decision_note,
    decidedById: row.decided_by,
    decidedByName: row.decided_by_name ?? '',
    decidedAt: row.decided_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
})
