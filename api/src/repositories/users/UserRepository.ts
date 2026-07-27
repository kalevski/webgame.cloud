import { randomUUID } from 'node:crypto'
import { inject, injectable } from 'tsyringe'
import type { User, UserRole } from '../../contracts/index.js'
import { OWNER_ROLE_ID } from '../../contracts/index.js'
import { Database } from '../../Database.js'
import { toUser, type UserRow } from '../../schema/users.js'

import COUNT_ACTIVE_OWNERS from './sql/count-active-owners.sql'
import COUNT_USERS from './sql/count-users.sql'
import FIND_USER_BY_EMAIL from './sql/find-user-by-email.sql'
import FIND_USER_BY_ID from './sql/find-user-by-id.sql'
import INSERT_USER from './sql/insert-user.sql'
import LIST_USERS from './sql/list-users.sql'
import RECORD_CONSENT from './sql/record-consent.sql'
import TOUCH_LAST_SEEN from './sql/touch-last-seen.sql'
import TOUCH_USER_PROFILE from './sql/touch-user-profile.sql'
import UPDATE_USER from './sql/update-user.sql'

export const normalizeEmail = (email: string): string => email.trim().toLowerCase()

@injectable()
export class UserRepository {
    constructor(@inject(Database) private database: Database) {}

    async findById(id: string): Promise<User | null> {
        const { rows } = await this.database.pool.query<UserRow>(FIND_USER_BY_ID, [id])
        return rows[0] ? toUser(rows[0]) : null
    }

    async findByEmail(email: string): Promise<User | null> {
        const { rows } = await this.database.pool.query<UserRow>(FIND_USER_BY_EMAIL, [normalizeEmail(email)])
        return rows[0] ? toUser(rows[0]) : null
    }

    async create(draft: {
        email: string
        name: string
        picture: string
        role: UserRole
    }): Promise<User> {
        const { rows } = await this.database.pool.query<UserRow>(INSERT_USER, [
            randomUUID(), normalizeEmail(draft.email), draft.name, draft.picture, draft.role,
        ])
        return toUser(rows[0])
    }

    async createWithAutoRole(draft: {
        email: string
        name: string
        picture: string

        defaultRoleId: string
    }): Promise<User> {
        return this.database.transaction(async (trx) => {
            await trx.query('SELECT pg_advisory_xact_lock(910238)')

            const existing = await trx.query<UserRow>(FIND_USER_BY_EMAIL, [normalizeEmail(draft.email)])
            if (existing.rows[0]) return toUser(existing.rows[0])
            const count = await trx.query<{ count: string }>(COUNT_USERS)
            const role: UserRole = Number(count.rows[0].count) === 0 ? OWNER_ROLE_ID : draft.defaultRoleId
            const { rows } = await trx.query<UserRow>(INSERT_USER, [
                randomUUID(), normalizeEmail(draft.email), draft.name, draft.picture, role,
            ])
            return toUser(rows[0])
        })
    }

    async touchProfile(
        id: string,
        profile: { name: string; picture: string }
    ): Promise<User | null> {
        const { rows } = await this.database.pool.query<UserRow>(TOUCH_USER_PROFILE, [
            id, profile.name, profile.picture,
        ])
        return rows[0] ? toUser(rows[0]) : null
    }

    async recordConsent(userId: string): Promise<User | null> {
        const { rows } = await this.database.pool.query<UserRow>(RECORD_CONSENT, [userId])
        return rows[0] ? toUser(rows[0]) : null
    }

    async touchLastSeen(userId: string): Promise<void> {
        await this.database.pool.query(TOUCH_LAST_SEEN, [userId])
    }

    async list(): Promise<User[]> {
        const { rows } = await this.database.pool.query<UserRow>(LIST_USERS)
        return rows.map(toUser)
    }

    async update(
        id: string,
        patch: { role?: UserRole; active?: boolean; verified?: boolean }
    ): Promise<User | null> {
        const { rows } = await this.database.pool.query<UserRow>(UPDATE_USER, [
            id, patch.role ?? null, patch.active ?? null, patch.verified ?? null,
        ])
        return rows[0] ? toUser(rows[0]) : null
    }

    async countActiveOwners(): Promise<number> {
        const { rows } = await this.database.pool.query<{ count: string }>(COUNT_ACTIVE_OWNERS)
        return Number(rows[0].count)
    }
}
