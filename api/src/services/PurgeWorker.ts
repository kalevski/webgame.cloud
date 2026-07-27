import { inject, injectable } from 'tsyringe'
import { formatDuration } from '@toolcase/base'
import { getLogger } from '../logging.js'
import { recordHeartbeat, registerWorker, unregisterWorker } from '../health.js'
import { RetentionService } from './RetentionService.js'

const log = getLogger('purge-worker')

@injectable()
export class PurgeWorker {
    constructor(@inject(RetentionService) private retention: RetentionService) {}

    private timer: NodeJS.Timeout | null = null

    private running = false

    private intervalMs = 0

    async init(): Promise<void> {
        const { intervalSeconds } = await this.retention.purgeSettings()
        this.schedule(intervalSeconds * 1000)
        log.info('purge worker started', { tick: formatDuration(this.intervalMs) })
    }

    async dispose(): Promise<void> {
        if (this.timer) clearInterval(this.timer)
        this.timer = null
        unregisterWorker('purge')
    }

    private schedule(intervalMs: number): void {
        if (this.timer) clearInterval(this.timer)
        this.intervalMs = intervalMs
        registerWorker('purge', intervalMs)
        this.timer = setInterval(() => void this.tick(), intervalMs)
        this.timer.unref()
    }

    async tick(): Promise<number> {
        recordHeartbeat('purge')
        if (this.running) return 0

        this.running = true
        try {
            const run = await this.retention.purgeOnce()

            const { intervalSeconds } = await this.retention.purgeSettings()
            if (intervalSeconds * 1000 !== this.intervalMs) {
                this.schedule(intervalSeconds * 1000)
                log.info('purge interval changed', { tick: formatDuration(this.intervalMs) })
            }

            return run.deleted
        } catch (error) {
            log.error('purge worker tick failed', error)
            return 0
        } finally {
            this.running = false
        }
    }
}
