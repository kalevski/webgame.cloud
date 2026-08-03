import { randomUUID } from 'node:crypto'
import { inject, injectable } from 'tsyringe'
import { Database, type QueryRunner } from '../../Database.js'
import { repositoryOptions } from '../../logging.js'
import { BaseRepository } from '@toolcase/node'
import type { TicketMessageRow } from '../../schema/tickets.js'

import SELECT_TICKET_MESSAGES from './sql/select-ticket-messages.sql'
import SELECT_TICKET_MESSAGE from './sql/select-ticket-message.sql'
import INSERT_TICKET_MESSAGE from './sql/insert-ticket-message.sql'

@injectable()
export class TicketMessageRepository extends BaseRepository<TicketMessageRow, QueryRunner> {
    constructor(@inject(Database) database: Database) {
        super(database.pool, 'ticket_messages', 'id', repositoryOptions)
    }

    async listForTicket(ticketId: string, trx?: QueryRunner): Promise<TicketMessageRow[]> {
        return this.time('listForTicket', async () => {
            const { rows } = await this.run(trx).query<TicketMessageRow>(SELECT_TICKET_MESSAGES, [ticketId])
            return rows
        })
    }

    async findById(id: string, trx?: QueryRunner): Promise<TicketMessageRow | undefined> {
        return this.time('findById', async () => {
            const { rows } = await this.run(trx).query<TicketMessageRow>(SELECT_TICKET_MESSAGE, [id])
            return rows[0]
        })
    }

    async create(
        ticketId: string,
        authorId: string,
        body: string,
        internal: boolean,
        trx?: QueryRunner
    ): Promise<TicketMessageRow> {
        return this.time('create', async () => {
            const { rows } = await this.run(trx).query<{ id: string }>(INSERT_TICKET_MESSAGE, [
                randomUUID(),
                ticketId,
                authorId,
                body.trim(),
                internal,
            ])
            const created = await this.findById(rows[0].id, trx)
            return created!
        })
    }
}
