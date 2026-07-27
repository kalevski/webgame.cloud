import { inject, injectable } from 'tsyringe'
import { Database, type QueryRunner } from '../../Database.js'
import { repositoryOptions } from '../../logging.js'
import { BaseRepository } from '@toolcase/node'
import type { PushSubscriptionRow } from '../../schema/notifications.js'

import UPSERT_PUSH_SUBSCRIPTION from './sql/upsert-push-subscription.sql'
import DELETE_PUSH_SUBSCRIPTION from './sql/delete-push-subscription.sql'
import DELETE_PUSH_ENDPOINT from './sql/delete-push-endpoint.sql'
import SELECT_PUSH_SUBSCRIPTIONS from './sql/select-push-subscriptions.sql'

@injectable()
export class PushSubscriptionRepository extends BaseRepository<PushSubscriptionRow, QueryRunner> {
    constructor(@inject(Database) database: Database) {
        super(database.pool, 'push_subscriptions', 'endpoint', repositoryOptions)
    }

    async save(row: PushSubscriptionRow, trx?: QueryRunner): Promise<void> {
        await this.time('save', async () => {
            await this.run(trx).query(UPSERT_PUSH_SUBSCRIPTION, [
                row.user_id, row.endpoint, row.p256dh, row.auth,
            ])
        })
    }

    async deleteForUser(userId: string, endpoint: string, trx?: QueryRunner): Promise<void> {
        await this.time('deleteForUser', async () => {
            await this.run(trx).query(DELETE_PUSH_SUBSCRIPTION, [userId, endpoint])
        })
    }

    async deleteEndpoint(endpoint: string, trx?: QueryRunner): Promise<void> {
        await this.time('deleteEndpoint', async () => {
            await this.run(trx).query(DELETE_PUSH_ENDPOINT, [endpoint])
        })
    }

    async listForUser(userId: string, trx?: QueryRunner): Promise<PushSubscriptionRow[]> {
        return this.time('listForUser', async () => {
            const { rows } = await this.run(trx).query<PushSubscriptionRow>(SELECT_PUSH_SUBSCRIPTIONS, [userId])
            return rows
        })
    }
}
