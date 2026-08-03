import { randomUUID } from 'node:crypto'
import { inject, injectable } from 'tsyringe'
import type { TicketFilters, TicketStatus } from '../../contracts/index.js'
import { Database, type QueryRunner } from '../../Database.js'
import { repositoryOptions } from '../../logging.js'
import { BaseRepository } from '@toolcase/node'
import type { TicketRow } from '../../schema/tickets.js'

import SELECT_TICKET from './sql/select-ticket.sql'
import SELECT_TICKETS_FOR_OWNER from './sql/select-tickets-for-owner.sql'
import SELECT_TICKETS_QUEUE from './sql/select-tickets-queue.sql'
import COUNT_TICKETS_QUEUE from './sql/count-tickets-queue.sql'
import COUNT_TICKETS_BY_STATUS from './sql/count-tickets-by-status.sql'
import INSERT_TICKET from './sql/insert-ticket.sql'
import UPDATE_TICKET from './sql/update-ticket.sql'
import TOUCH_TICKET from './sql/touch-ticket.sql'
import DELETE_TICKET from './sql/delete-ticket.sql'

const queueParams = (filters: TicketFilters): unknown[] => [
    filters.status ?? null,
    filters.assigneeId ?? null,
    filters.q?.trim() || null,
]

@injectable()
export class TicketRepository extends BaseRepository<TicketRow, QueryRunner> {
    constructor(@inject(Database) database: Database) {
        super(database.pool, 'tickets', 'id', repositoryOptions)
    }

    async findById(id: string, trx?: QueryRunner): Promise<TicketRow | undefined> {
        return this.time('findById', async () => {
            const { rows } = await this.run(trx).query<TicketRow>(SELECT_TICKET, [id])
            return rows[0]
        })
    }

    async listForOwner(ownerId: string, trx?: QueryRunner): Promise<TicketRow[]> {
        return this.time('listForOwner', async () => {
            const { rows } = await this.run(trx).query<TicketRow>(SELECT_TICKETS_FOR_OWNER, [ownerId])
            return rows
        })
    }

    async listQueue(filters: TicketFilters, trx?: QueryRunner): Promise<TicketRow[]> {
        return this.time('listQueue', async () => {
            const { rows } = await this.run(trx).query<TicketRow>(SELECT_TICKETS_QUEUE, [
                ...queueParams(filters),
                filters.limit ?? 25,
                filters.offset ?? 0,
            ])
            return rows
        })
    }

    async countQueue(filters: TicketFilters, trx?: QueryRunner): Promise<number> {
        return this.time('countQueue', async () => {
            const { rows } = await this.run(trx).query<{ c: number }>(COUNT_TICKETS_QUEUE, queueParams(filters))
            return rows[0]?.c ?? 0
        })
    }

    async countByStatus(trx?: QueryRunner): Promise<Array<{ status: TicketStatus; c: number }>> {
        return this.time('countByStatus', async () => {
            const { rows } = await this.run(trx).query<{ status: TicketStatus; c: number }>(COUNT_TICKETS_BY_STATUS)
            return rows
        })
    }

    async create(ownerId: string, subject: string, trx?: QueryRunner): Promise<TicketRow> {
        return this.time('create', async () => {
            const { rows } = await this.run(trx).query<{ id: string }>(INSERT_TICKET, [
                randomUUID(),
                ownerId,
                subject.trim(),
            ])
            const created = await this.findById(rows[0].id, trx)
            return created!
        })
    }

    async updateFields(
        id: string,
        patch: { status: TicketStatus; assigneeId: string | null },
        trx?: QueryRunner
    ): Promise<TicketRow | undefined> {
        return this.time('updateFields', async () => {
            const result = await this.run(trx).query(UPDATE_TICKET, [id, patch.status, patch.assigneeId])
            if ((result.rowCount ?? 0) === 0) return undefined
            return this.findById(id, trx)
        })
    }

    async touch(id: string, trx?: QueryRunner): Promise<void> {
        await this.time('touch', async () => {
            await this.run(trx).query(TOUCH_TICKET, [id])
        })
    }

    async remove(id: string, trx?: QueryRunner): Promise<boolean> {
        return this.time('remove', async () => {
            const result = await this.run(trx).query(DELETE_TICKET, [id])
            return (result.rowCount ?? 0) > 0
        })
    }
}
