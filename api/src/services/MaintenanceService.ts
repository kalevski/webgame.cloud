import { injectable } from 'tsyringe'
import { getLogger } from '../logging.js'
import { enqueueDueSchedules } from '../jobs.js'
import { recordHeartbeat, registerWorker, unregisterWorker } from '../health.js'
import { formatDuration } from '@toolcase/base'

const log = getLogger('maintenance')

@injectable()
export class MaintenanceService {
    private timer: NodeJS.Timeout | null = null

    private static readonly INTERVAL_MS = 60 * 1000

    async init(): Promise<void> {
        registerWorker('maintenance', MaintenanceService.INTERVAL_MS)
        this.sweep()
        this.timer = setInterval(() => this.sweep(), MaintenanceService.INTERVAL_MS)

        this.timer.unref()
        log.info('scheduler started', { tick: formatDuration(MaintenanceService.INTERVAL_MS) })
    }

    async dispose(): Promise<void> {
        if (this.timer) clearInterval(this.timer)
        this.timer = null
        unregisterWorker('maintenance')
    }

    private sweep(): void {
        recordHeartbeat('maintenance')
        const started = Date.now()
        enqueueDueSchedules()
            .then((enqueued) => {
                if (enqueued > 0) {
                    log.info('scheduled jobs enqueued', {
                        enqueued,
                        took: formatDuration(Date.now() - started),
                    })
                }
            })
            .catch((error) => log.error('scheduled job enqueue failed', error))
    }
}
