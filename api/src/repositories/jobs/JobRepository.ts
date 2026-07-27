import { inject, injectable } from 'tsyringe'
import { BaseRepository } from '@toolcase/node'
import { Database, type QueryRunner } from '../../Database.js'
import { repositoryOptions } from '../../logging.js'
import type { JobRow } from '../../schema/jobs.js'
import type { JobStatus } from '../../contracts/index.js'
import type { CursorQuery } from '../pagination.js'

import CLAIM_DUE_JOBS from './sql/claim-due-jobs.sql'
import COUNT_JOBS from './sql/count-jobs.sql'
import INSERT_JOB from './sql/insert-job.sql'
import MARK_JOB_DONE from './sql/mark-job-done.sql'
import MARK_JOB_FAILED from './sql/mark-job-failed.sql'
import RESET_STUCK_JOBS from './sql/reset-stuck-jobs.sql'
import SELECT_JOB from './sql/select-job.sql'
import SELECT_JOBS from './sql/select-jobs.sql'
import SELECT_LATEST_PER_KIND from './sql/select-latest-per-kind.sql'
import SELECT_JOB_STATS from './sql/select-job-stats.sql'
import UPDATE_JOB_STATUS from './sql/update-job-status.sql'

@injectable()
export class JobRepository extends BaseRepository<JobRow, QueryRunner> {
    constructor(@inject(Database) database: Database) {
        super(database.pool, 'jobs', 'id', repositoryOptions)
    }

    async insertJob(
        write: {
            id: string
            kind: string
            payload: Record<string, unknown>
            runAt: Date | null
            maxAttempts: number
            uniqueKey: string | null
        },
        trx?: QueryRunner
    ): Promise<JobRow | undefined> {
        return this.time('insert', async () => {
            const { rows } = await this.run(trx).query<{ id: string }>(INSERT_JOB, [
                write.id, write.kind, JSON.stringify(write.payload),
                write.runAt, write.maxAttempts, write.uniqueKey,
            ])
            if (rows.length === 0) return undefined
            return this.findById(rows[0].id, trx)
        })
    }

    async findById(id: string, trx?: QueryRunner): Promise<JobRow | undefined> {
        return this.time('findById', async () => {
            const { rows } = await this.run(trx).query<JobRow>(SELECT_JOB, [id])
            return rows[0]
        })
    }

    async latestPerKind(kinds: string[], trx?: QueryRunner): Promise<JobRow[]> {
        return this.time('latestPerKind', async () => {
            if (kinds.length === 0) return []
            const { rows } = await this.run(trx).query<JobRow>(SELECT_LATEST_PER_KIND, [kinds])
            return rows
        })
    }

    async claimDue(limit: number, trx?: QueryRunner): Promise<JobRow[]> {
        return this.time('claimDue', async () => {
            const { rows } = await this.run(trx).query<JobRow>(CLAIM_DUE_JOBS, [limit])
            return rows
        })
    }

    async markDone(id: string, trx?: QueryRunner): Promise<void> {
        await this.time('markDone', async () => {
            await this.run(trx).query(MARK_JOB_DONE, [id])
        })
    }

    async markFailed(id: string, error: string, backoffSeconds: number, trx?: QueryRunner): Promise<void> {
        await this.time('markFailed', async () => {
            await this.run(trx).query(MARK_JOB_FAILED, [id, error.slice(0, 2000), backoffSeconds])
        })
    }

    async resetStuck(trx?: QueryRunner): Promise<number> {
        return this.time('resetStuck', async () => {
            const result = await this.run(trx).query(RESET_STUCK_JOBS)
            return result.rowCount ?? 0
        })
    }

    async list(
        query: {
            status: string | null
            kind: string | null
            q: string | null
            limit: number
            offset: number
            cursor?: CursorQuery
        },
        trx?: QueryRunner
    ): Promise<JobRow[]> {
        return this.time('list', async () => {
            const { rows } = await this.run(trx).query<JobRow>(SELECT_JOBS, [
                query.status, query.kind, query.q, query.limit, query.offset,
                query.cursor?.createdAt ?? null, query.cursor?.id ?? null,
            ])
            return rows
        })
    }

    async countJobs(
        query: { status: string | null; kind: string | null; q: string | null },
        trx?: QueryRunner
    ): Promise<number> {
        return this.time('count', async () => {
            const { rows } = await this.run(trx).query<{ c: string }>(COUNT_JOBS, [
                query.status, query.kind, query.q,
            ])
            return Number(rows[0]?.c ?? 0)
        })
    }

    async stats(trx?: QueryRunner): Promise<Array<{ status: JobStatus; c: string }>> {
        return this.time('stats', async () => {
            const { rows } = await this.run(trx).query<{ status: JobStatus; c: string }>(SELECT_JOB_STATS)
            return rows
        })
    }

    async setStatus(id: string, status: JobStatus, trx?: QueryRunner): Promise<boolean> {
        return this.time('setStatus', async () => {
            const result = await this.run(trx).query(UPDATE_JOB_STATUS, [id, status])
            return (result.rowCount ?? 0) > 0
        })
    }
}
