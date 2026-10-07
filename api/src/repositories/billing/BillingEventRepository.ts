import { inject, injectable } from 'tsyringe'
import { BaseRepository } from '@toolcase/node'
import { Database, type QueryRunner } from '../../Database.js'
import { repositoryOptions } from '../../logging.js'
import type { BillingEventRow } from '../../schema/billing.js'
import type { BillingProvider, BillingEventStatus } from '../../contracts/index.js'

import COUNT_BILLING_EVENTS from './sql/count-billing-events.sql'
import INSERT_BILLING_EVENT from './sql/insert-billing-event.sql'
import RESET_BILLING_EVENT from './sql/reset-billing-event.sql'
import SELECT_BILLING_EVENT from './sql/select-billing-event.sql'
import SELECT_BILLING_EVENTS from './sql/select-billing-events.sql'
import UPDATE_BILLING_EVENT_STATUS from './sql/update-billing-event-status.sql'

export type BillingEventWrite = {
    id: string
    provider: BillingProvider
    providerEventId: string
    eventType: string
    providerSubscriptionId: string
    userId: string | null
    objectAt: Date
    payload: unknown
}

export type BillingEventQuery = {
    status: BillingEventStatus | null
    eventType: string | null
    userId: string | null
    q: string | null
    limit: number
    offset: number
}

@injectable()
export class BillingEventRepository extends BaseRepository<BillingEventRow, QueryRunner> {
    constructor(@inject(Database) database: Database) {
        super(database.pool, 'billing_event', 'id', repositoryOptions)
    }

    async insertEvent(write: BillingEventWrite, trx?: QueryRunner): Promise<BillingEventRow | undefined> {
        return this.time('insertEvent', async () => {
            const { rows } = await this.run(trx).query<{ id: string }>(INSERT_BILLING_EVENT, [
                write.id,
                write.provider,
                write.providerEventId,
                write.eventType,
                write.providerSubscriptionId,
                write.userId,
                write.objectAt,
                JSON.stringify(write.payload),
            ])
            if (rows.length === 0) return undefined
            return this.findById(rows[0].id, trx)
        })
    }

    async findById(id: string, trx?: QueryRunner): Promise<BillingEventRow | undefined> {
        return this.time('findById', async () => {
            const { rows } = await this.run(trx).query<BillingEventRow>(SELECT_BILLING_EVENT, [id])
            return rows[0]
        })
    }

    async list(query: BillingEventQuery, trx?: QueryRunner): Promise<BillingEventRow[]> {
        return this.time('list', async () => {
            const { rows } = await this.run(trx).query<BillingEventRow>(SELECT_BILLING_EVENTS, [
                query.status, query.eventType, query.userId, query.q, query.limit, query.offset,
            ])
            return rows
        })
    }

    async countEvents(query: BillingEventQuery, trx?: QueryRunner): Promise<number> {
        return this.time('countEvents', async () => {
            const { rows } = await this.run(trx).query<{ c: string }>(COUNT_BILLING_EVENTS, [
                query.status, query.eventType, query.userId, query.q,
            ])
            return Number(rows[0]?.c ?? 0)
        })
    }

    async markStatus(id: string, status: BillingEventStatus, error: string, trx?: QueryRunner): Promise<void> {
        await this.run(trx).query(UPDATE_BILLING_EVENT_STATUS, [id, status, error])
    }

    async reset(id: string, trx?: QueryRunner): Promise<BillingEventRow | undefined> {
        return this.time('reset', async () => {
            const result = await this.run(trx).query(RESET_BILLING_EVENT, [id])
            if ((result.rowCount ?? 0) === 0) return undefined
            return this.findById(id, trx)
        })
    }
}
