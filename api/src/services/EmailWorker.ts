import { inject, injectable } from 'tsyringe'
import { formatDuration } from '@toolcase/base'
import { getLogger } from '../logging.js'
import { recordHeartbeat, registerWorker, unregisterWorker } from '../health.js'
import { toEmailMessage } from '../schema/email.js'
import { EmailService } from './EmailService.js'
import { FeatureService } from './FeatureService.js'

const log = getLogger('email-worker')

@injectable()
export class EmailWorker {
    constructor(
        @inject(EmailService) private email: EmailService,
        @inject(FeatureService) private features: FeatureService
    ) {}

    private timer: NodeJS.Timeout | null = null

    private running = false

    private static readonly TICK_MS = 10_000

    async init(): Promise<void> {
        registerWorker('email', EmailWorker.TICK_MS)
        this.timer = setInterval(() => void this.tick(), EmailWorker.TICK_MS)
        this.timer.unref()
        log.info('email worker started', { tick: formatDuration(EmailWorker.TICK_MS) })
    }

    async dispose(): Promise<void> {
        if (this.timer) clearInterval(this.timer)
        this.timer = null
        unregisterWorker('email')
    }

    async tick(): Promise<number> {
        recordHeartbeat('email')
        if (this.running) return 0
        if (!(await this.features.isEnabled('email'))) return 0

        this.running = true
        const started = Date.now()
        try {
            await this.email.resetStuck()

            const { port, sender, batchSize } = await this.email.port()
            const claimed = await this.email.claimDue(batchSize)
            if (claimed.length === 0) return 0

            const results = await port.send(
                claimed.map((row) => {
                    const message = toEmailMessage(row)
                    return {
                        id: message.id,
                        toEmail: message.toEmail,
                        toName: message.toName,
                        subject: message.subject,
                        body: message.body,
                    }
                }),
                sender
            )

            let sent = 0
            for (const result of results) {
                if (result.ok) {
                    await this.email.markSent(result.id)
                    sent += 1
                } else {
                    await this.email.markFailed(result.id, result.error ?? 'send failed')
                }
            }

            log.info('email batch processed', {
                provider: port.id,
                claimed: claimed.length,
                sent,
                failed: claimed.length - sent,
                took: formatDuration(Date.now() - started),
            })
            return sent
        } catch (error) {
            log.error('email worker tick failed', error)
            return 0
        } finally {
            this.running = false
        }
    }
}
