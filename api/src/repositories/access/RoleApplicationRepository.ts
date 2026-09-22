import { inject, injectable } from 'tsyringe'
import { err, ok, type Result } from '@toolcase/base'
import type { OpenRole, RoleApplicationStatus } from '../../contracts/index.js'
import { Database, type QueryRunner } from '../../Database.js'
import type { RoleApplicationRow } from '../../schema/roles.js'
import { BaseRepository } from '@toolcase/node'
import { repositoryOptions } from '../../logging.js'

import COUNT_APPLICATIONS from './sql/count-applications.sql'
import DECIDE_APPLICATION from './sql/decide-application.sql'
import INSERT_APPLICATION from './sql/insert-application.sql'
import SELECT_APPLICABLE_ROLES from './sql/select-applicable-roles.sql'
import SELECT_APPLICATION from './sql/select-application.sql'
import SELECT_APPLICATIONS from './sql/select-applications.sql'
import SELECT_APPLICATIONS_FOR_USER from './sql/select-applications-for-user.sql'
import WITHDRAW_APPLICATION from './sql/withdraw-application.sql'

const UNIQUE_VIOLATION = '23505'

export type ApplicationCreateConflict = 'open'

export type ApplicationQuery = {
    status: RoleApplicationStatus | null
    roleId: string | null
    q: string | null
    limit: number
    offset: number
}

@injectable()
export class RoleApplicationRepository extends BaseRepository<unknown, QueryRunner> {
    constructor(@inject(Database) database: Database) {
        super(database.pool, 'role_applications', 'id', repositoryOptions)
    }

    async listApplicableRoles(trx?: QueryRunner): Promise<OpenRole[]> {
        return this.time('listApplicableRoles', async () => {
            const { rows } = await this.run(trx).query<{ id: string; name: string; application_prompt: string }>(
                SELECT_APPLICABLE_ROLES
            )
            return rows.map((row) => ({
                id: row.id,
                name: row.name,
                applicationPrompt: row.application_prompt,
            }))
        })
    }

    async create(
        write: { id: string; userId: string; roleId: string; message: string },
        trx?: QueryRunner
    ): Promise<Result<RoleApplicationRow | undefined, ApplicationCreateConflict>> {
        return this.time('create', async () => {
            try {
                await this.run(trx).query(INSERT_APPLICATION, [write.id, write.userId, write.roleId, write.message])
            } catch (error) {
                if ((error as { code?: string }).code === UNIQUE_VIOLATION) return err('open')
                throw error
            }
            return ok(await this.findById(write.id, trx))
        })
    }

    async findById(id: string, trx?: QueryRunner): Promise<RoleApplicationRow | undefined> {
        return this.time('findById', async () => {
            const { rows } = await this.run(trx).query<RoleApplicationRow>(SELECT_APPLICATION, [id])
            return rows[0]
        })
    }

    async list(query: ApplicationQuery, trx?: QueryRunner): Promise<RoleApplicationRow[]> {
        return this.time('list', async () => {
            const { rows } = await this.run(trx).query<RoleApplicationRow>(SELECT_APPLICATIONS, [
                query.status, query.roleId, query.q, query.limit, query.offset,
            ])
            return rows
        })
    }

    async count(query: ApplicationQuery, trx?: QueryRunner): Promise<number> {
        return this.time('count', async () => {
            const { rows } = await this.run(trx).query<{ c: string }>(COUNT_APPLICATIONS, [
                query.status, query.roleId, query.q,
            ])
            return Number(rows[0]?.c ?? 0)
        })
    }

    async listForUser(userId: string, trx?: QueryRunner): Promise<RoleApplicationRow[]> {
        return this.time('listForUser', async () => {
            const { rows } = await this.run(trx).query<RoleApplicationRow>(SELECT_APPLICATIONS_FOR_USER, [userId])
            return rows
        })
    }

    async decide(
        id: string,
        decision: { status: Exclude<RoleApplicationStatus, 'pending' | 'withdrawn'>; note: string; deciderId: string },
        trx?: QueryRunner
    ): Promise<boolean> {
        return this.time('decide', async () => {
            const result = await this.run(trx).query(DECIDE_APPLICATION, [
                id, decision.status, decision.note, decision.deciderId,
            ])
            return (result.rowCount ?? 0) > 0
        })
    }

    async withdraw(id: string, userId: string, trx?: QueryRunner): Promise<boolean> {
        return this.time('withdraw', async () => {
            const result = await this.run(trx).query(WITHDRAW_APPLICATION, [id, userId])
            return (result.rowCount ?? 0) > 0
        })
    }
}
