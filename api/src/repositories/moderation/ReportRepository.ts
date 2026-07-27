import { randomUUID } from 'node:crypto'
import { inject, injectable } from 'tsyringe'
import type { ReportStatus, ReportTargetKind } from '../../contracts/index.js'
import { Database, type QueryRunner } from '../../Database.js'
import { repositoryOptions } from '../../logging.js'
import { BaseRepository } from '@toolcase/node'
import { ok, err, type Result } from '@toolcase/base'
import type { ReportRow } from '../../schema/moderation.js'

import INSERT_REPORT from './sql/insert-report.sql'
import SELECT_REPORT from './sql/select-report.sql'
import SELECT_REPORTS from './sql/select-reports.sql'
import SELECT_REPORTS_BY_STATUS from './sql/select-reports-by-status.sql'
import RESOLVE_REPORT from './sql/resolve-report.sql'
import COUNT_PENDING_REPORTS from './sql/count-pending-reports.sql'

const UNIQUE_VIOLATION = '23505'

export type ReportCreateConflict = 'exists'

export type ResolveReportConflict = 'not_pending' | 'missing'

@injectable()
export class ReportRepository extends BaseRepository<ReportRow, QueryRunner> {
    constructor(@inject(Database) database: Database) {
        super(database.pool, 'reports', 'id', repositoryOptions)
    }

    async create(
        values: {
            reporterId: string
            targetKind: ReportTargetKind
            targetId: string
            targetLabel: string
            reason: string
        },
        trx?: QueryRunner
    ): Promise<Result<ReportRow, ReportCreateConflict>> {
        return this.time('create', async () => {
            try {
                const { rows } = await this.run(trx).query<{ id: string }>(INSERT_REPORT, [
                    randomUUID(), values.reporterId, values.targetKind,
                    values.targetId, values.targetLabel, values.reason,
                ])
                const created = await this.findById(rows[0].id, trx)
                return ok(created!)
            } catch (error) {
                if ((error as { code?: string }).code === UNIQUE_VIOLATION) return err('exists')
                throw error
            }
        })
    }

    async findById(id: string, trx?: QueryRunner): Promise<ReportRow | undefined> {
        return this.time('findById', async () => {
            const { rows } = await this.run(trx).query<ReportRow>(SELECT_REPORT, [id])
            return rows[0]
        })
    }

    async list(status: ReportStatus | undefined, offset = 0, trx?: QueryRunner): Promise<ReportRow[]> {
        return this.time('list', async () => {
            const { rows } = status
                ? await this.run(trx).query<ReportRow>(SELECT_REPORTS_BY_STATUS, [status, offset])
                : await this.run(trx).query<ReportRow>(SELECT_REPORTS, [offset])
            return rows
        })
    }

    async resolve(
        id: string,
        resolvedBy: string,
        resolution: string,
        trx?: QueryRunner
    ): Promise<Result<ReportRow, ResolveReportConflict>> {
        return this.time('resolve', async () => {
            const result = await this.run(trx).query(RESOLVE_REPORT, [id, resolvedBy, resolution])
            if ((result.rowCount ?? 0) === 0) {
                const existing = await this.findById(id, trx)
                return err(existing ? 'not_pending' : 'missing')
            }
            const updated = await this.findById(id, trx)
            return ok(updated!)
        })
    }

    async countPending(trx?: QueryRunner): Promise<number> {
        return this.time('countPending', async () => {
            const { rows } = await this.run(trx).query<{ count: string }>(COUNT_PENDING_REPORTS)
            return Number(rows[0].count)
        })
    }
}
