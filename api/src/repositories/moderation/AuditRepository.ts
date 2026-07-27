import { randomUUID } from 'node:crypto'
import { inject, injectable } from 'tsyringe'
import { Database, type QueryRunner } from '../../Database.js'
import { repositoryOptions } from '../../logging.js'
import { BaseRepository } from '@toolcase/node'
import type { AuditRow } from '../../schema/moderation.js'
import type { CursorQuery } from '../pagination.js'

import COUNT_AUDIT_ENTRIES from './sql/count-audit-entries.sql'
import INSERT_AUDIT_ENTRY from './sql/insert-audit-entry.sql'
import SELECT_AUDIT_ACTIONS from './sql/select-audit-actions.sql'
import SELECT_AUDIT_ENTRIES from './sql/select-audit-entries.sql'

export type AuditQuery = {
    actorId: string | null
    action: string | null
    from: Date | null
    to: Date | null
    q: string | null
    limit: number
    offset: number
    cursor?: CursorQuery
}

@injectable()
export class AuditRepository extends BaseRepository<AuditRow, QueryRunner> {
    constructor(@inject(Database) database: Database) {
        super(database.pool, 'audit_log', 'id', repositoryOptions)
    }

    async record(
        actorId: string | null,
        actorName: string,
        action: string,
        targetId: string,
        detail = '',
        requestId = '',
        trx?: QueryRunner
    ): Promise<void> {
        try {
            await this.time('record', async () => {
                await this.run(trx).query(INSERT_AUDIT_ENTRY, [
                    randomUUID(), actorId, actorName, action, targetId, detail, requestId,
                ])
            })
        } catch {
        }
    }

    async list(query: AuditQuery, trx?: QueryRunner): Promise<AuditRow[]> {
        return this.time('list', async () => {
            const { rows } = await this.run(trx).query<AuditRow>(SELECT_AUDIT_ENTRIES, [
                query.actorId, query.action, query.from, query.to, query.q, query.limit, query.offset,
                query.cursor?.createdAt ?? null, query.cursor?.id ?? null,
            ])
            return rows
        })
    }

    async count(query: AuditQuery, trx?: QueryRunner): Promise<number> {
        return this.time('count', async () => {
            const { rows } = await this.run(trx).query<{ c: string }>(COUNT_AUDIT_ENTRIES, [
                query.actorId, query.action, query.from, query.to, query.q,
            ])
            return Number(rows[0]?.c ?? 0)
        })
    }

    async listActions(trx?: QueryRunner): Promise<string[]> {
        const { rows } = await this.run(trx).query<{ action: string }>(SELECT_AUDIT_ACTIONS)
        return rows.map((row) => row.action)
    }
}
