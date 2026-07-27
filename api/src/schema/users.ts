import type { OAuthProvider, User, UserIdentity, UserRole } from '../contracts/index.js'

export type UserRow = {
    id: string
    email: string
    name: string
    picture: string
    role: UserRole
    active: boolean
    verified: boolean
    consented_at: Date | null
    created_at: Date
}

export const toUser = (row: UserRow): User => ({
    id: row.id,
    email: row.email,
    name: row.name,
    picture: row.picture,
    role: row.role,
    active: row.active,
    verified: row.verified,
    consentedAt: row.consented_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
})

export type SessionRow = {
    id: string
    public_id: string
    user_id: string
    user_agent: string
    ip: string
    created_at: Date
    last_seen_at: Date
    expires_at: Date
}

export type UserIdentityRow = {
    user_id: string
    provider: OAuthProvider
    subject: string
    email: string
    created_at: Date
}

export const toUserIdentity = (row: UserIdentityRow): UserIdentity => ({
    provider: row.provider,
    email: row.email,
    createdAt: row.created_at.toISOString(),
})
