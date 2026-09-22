import type { NotificationKind } from './contracts/index.js'
import container from './container.js'
import { NotificationService } from './services/NotificationService.js'
import { getLogger } from './logging.js'

const log = getLogger('notify')

let suppressed = false
let suppressedCount = 0

export const suppressDispatch = (): void => {
    suppressed = true
    suppressedCount = 0
}

export const resumeDispatch = (): number => {
    suppressed = false
    const count = suppressedCount
    suppressedCount = 0
    return count
}

export const dispatchSuppressed = (): boolean => {
    if (suppressed) suppressedCount += 1
    return suppressed
}

export const notify = async (
    userId: string,
    kind: NotificationKind,
    title: string,
    link: string,
    options: { collapse?: boolean } = {}
): Promise<void> => {
    if (dispatchSuppressed()) return
    try {
        await container.resolve(NotificationService).notify(userId, kind, title, link, options)
    } catch (error) {
        log.warning('could not deliver notification', { userId, kind, error: String(error) })
    }
}
