import { randomUUID } from 'node:crypto'
import { inject, injectable } from 'tsyringe'
import { BaseRepository } from '@toolcase/node'
import { Database, type QueryRunner } from '../../Database.js'
import { repositoryOptions } from '../../logging.js'

export type WaitlistRow = {
    id: string
    email: string
    marketing_opt_in: boolean
    consent_version: string
    source: string
    granted_bytes: string | number
    claimed_by: string | null
    claimed_at: Date | null
    created_at: Date
}

@injectable()
export class WaitlistRepository extends BaseRepository<WaitlistRow, QueryRunner> {
    constructor(@inject(Database) database: Database) {
        super(database.pool, 'waitlist_signups', 'id', repositoryOptions)
    }

    async upsertSignup(
        write: { email: string; marketingOptIn: boolean; consentVersion: string; source: string },
        trx?: QueryRunner
    ): Promise<string> {
        const { rows } = await this.run(trx).query<{ id: string }>(UPSERT_SIGNUP, [
            randomUUID(),
            write.email,
            write.marketingOptIn,
            write.consentVersion,
            write.source,
        ])
        return rows[0].id
    }

    async list(
        query: { limit?: number; offset?: number; cursorCreatedAt?: string; cursorId?: string } = {},
        trx?: QueryRunner
    ): Promise<WaitlistRow[]> {
        const { rows } = await this.run(trx).query<WaitlistRow>(SELECT_SIGNUPS, [
            Math.min(200, query.limit ?? 50),
            query.cursorCreatedAt ? 0 : query.offset ?? 0,
            query.cursorCreatedAt ?? null,
            query.cursorId ?? null,
        ])
        return rows
    }

    async findByEmail(email: string, trx?: QueryRunner): Promise<WaitlistRow | undefined> {
        const { rows } = await this.run(trx).query<WaitlistRow>(SELECT_SIGNUP_BY_EMAIL, [email])
        return rows[0]
    }

    async findById(id: string, trx?: QueryRunner): Promise<WaitlistRow | undefined> {
        const { rows } = await this.run(trx).query<WaitlistRow>(SELECT_SIGNUP, [id])
        return rows[0]
    }

    async markClaimed(id: string, userId: string, trx?: QueryRunner): Promise<void> {
        await this.run(trx).query(MARK_CLAIMED, [id, userId])
    }

    async stats(trx?: QueryRunner): Promise<{ total: number; claimed: number }> {
        const { rows } = await this.run(trx).query<{ total: string; claimed: string }>(COUNT_SIGNUPS)
        return { total: Number(rows[0]?.total ?? 0), claimed: Number(rows[0]?.claimed ?? 0) }
    }
}

import UPSERT_SIGNUP from './sql/upsert-signup.sql'
import SELECT_SIGNUPS from './sql/select-signups.sql'
import SELECT_SIGNUP_BY_EMAIL from './sql/select-signup-by-email.sql'
import SELECT_SIGNUP from './sql/select-signup.sql'
import MARK_CLAIMED from './sql/mark-claimed.sql'
import COUNT_SIGNUPS from './sql/count-signups.sql'
