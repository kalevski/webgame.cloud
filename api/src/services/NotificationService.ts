import { inject, injectable } from 'tsyringe'
import type { AppNotification, NotificationKind, NotificationsResult } from '../contracts/index.js'
import type { NotificationRow } from '../schema/notifications.js'
import { NotificationRepository } from '../repositories/notifications/NotificationRepository.js'
import { PushService } from './PushService.js'

const toNotification = (row: NotificationRow): AppNotification => ({
    id: row.id,
    kind: row.kind,
    title: row.title,
    link: row.link,
    readAt: row.read_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
})

@injectable()
export class NotificationService {
    constructor(
        @inject(NotificationRepository) private notifications: NotificationRepository,
        @inject(PushService) private push: PushService
    ) {}

    async list(userId: string): Promise<NotificationsResult> {
        const { rows, unread } = await this.notifications.listWithUnread(userId)
        return { notifications: rows.map(toNotification), unread }
    }

    async markRead(userId: string, ids?: string[]): Promise<void> {
        if (ids && ids.length === 0) return
        await this.notifications.markRead(userId, ids)
    }

    async markReadByLink(userId: string, kind: NotificationKind, link: string): Promise<void> {
        await this.notifications.markReadByLink(userId, kind, link)
    }

    async notify(
        userId: string,
        kind: NotificationKind,
        title: string,
        link: string,
        options: { collapse?: boolean } = {}
    ): Promise<AppNotification> {
        const row = await this.notifications.create(userId, kind, title, link, options)
        void this.push.sendToUser(userId, { title, link }).catch(() => undefined)
        return toNotification(row)
    }
}
