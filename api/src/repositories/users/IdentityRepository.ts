import { inject, injectable } from 'tsyringe'
import { ok, err, type Result } from '@toolcase/base'
import type { OAuthProvider, User } from '../../contracts/index.js'
import { Database } from '../../Database.js'
import { toUser, type UserIdentityRow, type UserRow } from '../../schema/users.js'

import DELETE_IDENTITY_FOR_PROVIDER from './sql/delete-identity-for-provider.sql'
import FIND_IDENTITY from './sql/find-identity.sql'
import FIND_USER_BY_IDENTITY from './sql/find-user-by-identity.sql'
import INSERT_IDENTITY from './sql/insert-identity.sql'
import SELECT_IDENTITIES_BY_USER from './sql/select-identities-by-user.sql'
import UPDATE_IDENTITY_EMAIL from './sql/update-identity-email.sql'

export type IdentityLinkConflict = 'linked_elsewhere'

const LINKED_ELSEWHERE = Symbol('linked_elsewhere')

@injectable()
export class IdentityRepository {
    constructor(@inject(Database) private database: Database) {}

    async findUserByIdentity(provider: OAuthProvider, subject: string): Promise<User | null> {
        const { rows } = await this.database.pool.query<UserRow>(FIND_USER_BY_IDENTITY, [provider, subject])
        return rows[0] ? toUser(rows[0]) : null
    }

    async listForUser(userId: string): Promise<UserIdentityRow[]> {
        const { rows } = await this.database.pool.query<UserIdentityRow>(SELECT_IDENTITIES_BY_USER, [userId])
        return rows
    }

    async link(
        userId: string,
        provider: OAuthProvider,
        subject: string,
        email: string
    ): Promise<Result<UserIdentityRow, IdentityLinkConflict>> {
        try {
            const linked = await this.database.transaction(async (trx) => {
                const existing = await trx.query<UserIdentityRow>(FIND_IDENTITY, [provider, subject])
                if (existing.rows[0]) {
                    if (existing.rows[0].user_id !== userId) throw LINKED_ELSEWHERE
                    const updated = await trx.query<UserIdentityRow>(UPDATE_IDENTITY_EMAIL, [provider, subject, email])
                    return updated.rows[0]
                }
                await trx.query(DELETE_IDENTITY_FOR_PROVIDER, [userId, provider])
                const { rows } = await trx.query<UserIdentityRow>(INSERT_IDENTITY, [userId, provider, subject, email])
                return rows[0]
            })
            return ok(linked)
        } catch (error) {
            if (error === LINKED_ELSEWHERE) return err('linked_elsewhere')
            throw error
        }
    }

    async unlink(userId: string, provider: OAuthProvider): Promise<boolean> {
        const result = await this.database.pool.query(DELETE_IDENTITY_FOR_PROVIDER, [userId, provider])
        return (result.rowCount ?? 0) > 0
    }
}
