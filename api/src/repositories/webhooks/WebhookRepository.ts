import { inject, injectable } from 'tsyringe'
import { Database, type QueryRunner } from '../../Database.js'
import type { WebhookDeliveryRow, WebhookEndpointRow } from '../../schema/webhooks.js'
import type { CursorQuery } from '../pagination.js'
import { BaseRepository } from '@toolcase/node'
import { repositoryOptions } from '../../logging.js'

import COUNT_DELIVERIES from './sql/count-deliveries.sql'
import DELETE_ENDPOINT from './sql/delete-endpoint.sql'
import INSERT_DELIVERY from './sql/insert-delivery.sql'
import INSERT_ENDPOINT from './sql/insert-endpoint.sql'
import MARK_DELIVERY_FAILED from './sql/mark-delivery-failed.sql'
import MARK_DELIVERY_SENT from './sql/mark-delivery-sent.sql'
import SELECT_DELIVERIES from './sql/select-deliveries.sql'
import SELECT_DELIVERY from './sql/select-delivery.sql'
import SELECT_ENDPOINT from './sql/select-endpoint.sql'
import SELECT_ENDPOINTS from './sql/select-endpoints.sql'
import SELECT_ENDPOINTS_FOR_ACTION from './sql/select-endpoints-for-action.sql'
import UPDATE_ENDPOINT from './sql/update-endpoint.sql'

@injectable()
export class WebhookRepository extends BaseRepository<unknown, QueryRunner> {
    constructor(@inject(Database) database: Database) {
        super(database.pool, 'webhooks', 'id', repositoryOptions)
    }

    async insertEndpoint(
        write: { id: string; url: string; secret: string; description: string; events: string[]; active: boolean },
        trx?: QueryRunner
    ): Promise<WebhookEndpointRow | undefined> {
        return this.time('insertEndpoint', async () => {
            await this.run(trx).query(INSERT_ENDPOINT, [
                write.id, write.url, write.secret, write.description, JSON.stringify(write.events), write.active,
            ])
            return this.findEndpoint(write.id, trx)
        })
    }

    async updateEndpoint(
        id: string,
        patch: {
            url: string | null
            secret: string | null
            description: string | null
            events: string[] | null
            active: boolean | null
        },
        trx?: QueryRunner
    ): Promise<WebhookEndpointRow | undefined> {
        const result = await this.run(trx).query(UPDATE_ENDPOINT, [
            id, patch.url, patch.secret, patch.description,
            patch.events === null ? null : JSON.stringify(patch.events),
            patch.active,
        ])
        if ((result.rowCount ?? 0) === 0) return undefined
        return this.findEndpoint(id, trx)
    }

    async deleteEndpoint(id: string, trx?: QueryRunner): Promise<boolean> {
        return this.time('deleteEndpoint', async () => {
            const result = await this.run(trx).query(DELETE_ENDPOINT, [id])
            return (result.rowCount ?? 0) > 0
        })
    }

    async findEndpoint(id: string, trx?: QueryRunner): Promise<WebhookEndpointRow | undefined> {
        return this.time('findEndpoint', async () => {
            const { rows } = await this.run(trx).query<WebhookEndpointRow>(SELECT_ENDPOINT, [id])
            return rows[0]
        })
    }

    async listEndpoints(trx?: QueryRunner): Promise<WebhookEndpointRow[]> {
        return this.time('listEndpoints', async () => {
            const { rows } = await this.run(trx).query<WebhookEndpointRow>(SELECT_ENDPOINTS)
            return rows
        })
    }

    async endpointsForAction(action: string, trx?: QueryRunner): Promise<WebhookEndpointRow[]> {
        return this.time('endpointsForAction', async () => {
            const { rows } = await this.run(trx).query<WebhookEndpointRow>(SELECT_ENDPOINTS_FOR_ACTION, [action])
            return rows
        })
    }

    async insertDelivery(
        write: { id: string; endpointId: string; action: string; payload: Record<string, unknown> },
        trx?: QueryRunner
    ): Promise<string> {
        return this.time('insertDelivery', async () => {
            await this.run(trx).query(INSERT_DELIVERY, [
                write.id, write.endpointId, write.action, JSON.stringify(write.payload),
            ])
            return write.id
        })
    }

    async findDelivery(id: string, trx?: QueryRunner): Promise<WebhookDeliveryRow | undefined> {
        return this.time('findDelivery', async () => {
            const { rows } = await this.run(trx).query<WebhookDeliveryRow>(SELECT_DELIVERY, [id])
            return rows[0]
        })
    }

    async listDeliveries(
        query: {
            endpointId: string | null
            status: string | null
            action: string | null
            q: string | null
            limit: number
            offset: number
            cursor?: CursorQuery
        },
        trx?: QueryRunner
    ): Promise<WebhookDeliveryRow[]> {
        const { rows } = await this.run(trx).query<WebhookDeliveryRow>(SELECT_DELIVERIES, [
            query.endpointId, query.status, query.action, query.q, query.limit, query.offset,
            query.cursor?.createdAt ?? null, query.cursor?.id ?? null,
        ])
        return rows
    }

    async countDeliveries(
        query: { endpointId: string | null; status: string | null; action: string | null; q: string | null },
        trx?: QueryRunner
    ): Promise<number> {
        return this.time('countDeliveries', async () => {
            const { rows } = await this.run(trx).query<{ c: string }>(COUNT_DELIVERIES, [
                query.endpointId, query.status, query.action, query.q,
            ])
            return Number(rows[0]?.c ?? 0)
        })
    }

    async markDelivered(id: string, responseStatus: number, trx?: QueryRunner): Promise<void> {
        return this.time('markDelivered', async () => {
            await this.run(trx).query(MARK_DELIVERY_SENT, [id, responseStatus])
        })
    }

    async markFailed(id: string, responseStatus: number | null, error: string, trx?: QueryRunner): Promise<void> {
        return this.time('markFailed', async () => {
            await this.run(trx).query(MARK_DELIVERY_FAILED, [id, responseStatus, error.slice(0, 2000)])
        })
    }
}
