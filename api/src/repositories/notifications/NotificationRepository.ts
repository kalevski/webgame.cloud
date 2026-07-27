import { randomUUID } from 'node:crypto'
import { inject, injectable } from 'tsyringe'
import type { NotificationKind } from '../../contracts/index.js'
import { Database, type QueryRunner } from '../../Database.js'
import { repositoryOptions } from '../../logging.js'
import { BaseRepository } from '@toolcase/node'
import type { NotificationRow } from '../../schema/notifications.js'

import COLLAPSE_NOTIFICATION from './sql/collapse-notification.sql'
import INSERT_NOTIFICATION from './sql/insert-notification.sql'
import SELECT_NOTIFICATIONS from './sql/select-notifications.sql'
import COUNT_UNREAD from './sql/count-unread.sql'
import MARK_READ_BY_IDS from './sql/mark-read-by-ids.sql'
import MARK_ALL_READ from './sql/mark-all-read.sql'
import MARK_READ_BY_LINK from './sql/mark-read-by-link.sql'

const LIST_LIMIT = 50

@injectable()
export class NotificationRepository extends BaseRepository<NotificationRow, QueryRunner> {
    constructor(@inject(Database) database: Database) {
        super(database.pool, 'notifications', 'id', repositoryOptions)
    }

    async create(
        userId: string,
        kind: NotificationKind,
        title: string,
        link: string,
        options: { collapse?: boolean } = {},
        trx?: QueryRunner
    ): Promise<NotificationRow> {
        return this.time('create', async () => {
            const runner = this.run(trx)
            if (options.collapse) {
                const { rows } = await runner.query<NotificationRow>(COLLAPSE_NOTIFICATION, [userId, kind, link, title])
                if (rows[0]) return rows[0]
            }
            const { rows } = await runner.query<NotificationRow>(INSERT_NOTIFICATION, [
                randomUUID(), userId, kind, title, link,
            ])
            return rows[0]
        })
    }

    async listWithUnread(userId: string, trx?: QueryRunner): Promise<{ rows: NotificationRow[]; unread: number }> {
        return this.time('listWithUnread', async () => {
            const runner = this.run(trx)
            const [list, unread] = await Promise.all([
                runner.query<NotificationRow>(SELECT_NOTIFICATIONS, [userId, LIST_LIMIT]),
                runner.query<{ count: string }>(COUNT_UNREAD, [userId]),
            ])
            return { rows: list.rows, unread: Number(unread.rows[0].count) }
        })
    }

    async markRead(userId: string, ids: string[] | undefined, trx?: QueryRunner): Promise<void> {
        await this.time('markRead', async () => {
            const runner = this.run(trx)
            if (ids) {
                await runner.query(MARK_READ_BY_IDS, [userId, ids])
                return
            }
            await runner.query(MARK_ALL_READ, [userId])
        })
    }

    async markReadByLink(userId: string, kind: NotificationKind, link: string, trx?: QueryRunner): Promise<void> {
        await this.time('markReadByLink', async () => {
            await this.run(trx).query(MARK_READ_BY_LINK, [userId, kind, link])
        })
    }
}
