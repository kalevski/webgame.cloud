import type { NotificationKind } from './contracts/index.js'
import container from './container.js'
import { NotificationService } from './services/NotificationService.js'
import { getLogger } from './logging.js'

const log = getLogger('notify')

export const notify = async (
    userId: string,
    kind: NotificationKind,
    title: string,
    link: string,
    options: { collapse?: boolean } = {}
): Promise<void> => {
    try {
        await container.resolve(NotificationService).notify(userId, kind, title, link, options)
    } catch (error) {
        log.warning('could not deliver notification', { userId, kind, error: String(error) })
    }
}
