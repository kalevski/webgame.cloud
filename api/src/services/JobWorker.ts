import { inject, injectable } from 'tsyringe'
import { Async, formatDuration } from '@toolcase/base'
import { getLogger } from '../logging.js'
import { drain } from '../domain/drain.js'
import { recordHeartbeat, registerWorker, unregisterWorker } from '../health.js'
import { getJobHandler } from '../domain/jobs.js'
import { JobRepository } from '../repositories/jobs/JobRepository.js'

const log = getLogger('job-worker')

@injectable()
export class JobWorker {
    constructor(@inject(JobRepository) private jobs: JobRepository) {}

    private timer: NodeJS.Timeout | null = null

    private running = false

    private static readonly TICK_MS = 5_000

    private static readonly BATCH_SIZE = 10

    private static readonly CONCURRENCY = 4

    private static readonly BACKOFF_SECONDS = 30

    async init(): Promise<void> {
        registerWorker('jobs', JobWorker.TICK_MS)
        this.timer = setInterval(() => void this.tick(), JobWorker.TICK_MS)
        this.timer.unref()
        log.info('job worker started', { tick: formatDuration(JobWorker.TICK_MS) })
    }

    async dispose(): Promise<void> {
        if (this.timer) clearInterval(this.timer)
        this.timer = null
        if (!(await drain(() => this.running))) {
            log.warning('job worker still busy at shutdown, abandoning the batch')
        }
        unregisterWorker('jobs')
    }

    async tick(): Promise<number> {
        recordHeartbeat('jobs')
        if (this.running) return 0

        this.running = true
        try {
            await this.jobs.resetStuck()

            const claimed = await this.jobs.claimDue(JobWorker.BATCH_SIZE)
            if (claimed.length === 0) return 0

            const limit = Async.pLimit(JobWorker.CONCURRENCY)
            const outcomes = await Promise.all(claimed.map((row) => limit(async () => {
                const handler = getJobHandler(row.kind)
                if (!handler) {
                    await this.jobs.markFailed(row.id, `no handler for kind "${row.kind}"`, JobWorker.BACKOFF_SECONDS)
                    return false
                }

                try {
                    await handler(row.payload ?? {}, { id: row.id, kind: row.kind, attempts: row.attempts })
                    await this.jobs.markDone(row.id)
                    return true
                } catch (error) {
                    const message = error instanceof Error ? error.message : String(error)
                    await this.jobs.markFailed(row.id, message, JobWorker.BACKOFF_SECONDS)
                    log.error('job failed', { kind: row.kind, id: row.id, message })
                    return false
                }
            })))

            const done = outcomes.filter(Boolean).length
            log.info('job batch processed', { claimed: claimed.length, done, failed: claimed.length - done })
            return done
        } catch (error) {
            log.error('job worker tick failed', error)
            return 0
        } finally {
            this.running = false
        }
    }
}
