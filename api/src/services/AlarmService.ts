import { inject, injectable } from 'tsyringe'
import { ALARM_THRESHOLDS, OWNER_ROLE_ID, type Alarm } from '../contracts/index.js'
import { WORKSPACE_NAME } from '../env.js'
import { reportError } from '../domain/observability.js'
import { getLogger } from '../logging.js'
import { EmailRepository } from '../repositories/email/EmailRepository.js'
import { EmailService } from './EmailService.js'
import { FeatureService } from './FeatureService.js'
import { HealthService } from './HealthService.js'
import { SettingsService } from './SettingsService.js'

const log = getLogger('alarm')

const notifiedKey = (key: string): string => `alarm_notified_${key}`

@injectable()
export class AlarmService {
    constructor(
        @inject(HealthService) private health: HealthService,
        @inject(SettingsService) private settings: SettingsService,
        @inject(FeatureService) private features: FeatureService,
        @inject(EmailService) private email: EmailService,
        @inject(EmailRepository) private emailRepository: EmailRepository
    ) {}

    async sweep(): Promise<Alarm[]> {
        const { alarms } = await this.health.report()
        const firing = alarms.filter((alarm) => alarm.firing)

        for (const alarm of firing) {
            log.warning('alarm firing', { alarm: alarm.key, detail: alarm.detail })
            reportError(new Error(`alarm ${alarm.key}: ${alarm.sentence}`), {
                source: 'health_sweep',
                detail: { alarm: alarm.key, detail: alarm.detail },
            })
        }

        for (const alarm of firing) {
            if (alarm.key === 'mail_down' || alarm.key === 'mail_backlog') continue
            await this.digest(alarm)
        }

        return firing
    }

    private async digest(alarm: Alarm): Promise<void> {
        if (!(await this.features.isEnabled('email'))) return

        const key = notifiedKey(alarm.key)
        const last = await this.settings.getRaw(key)
        const lastAt = last ? Number(last) : 0
        const throttleMs = ALARM_THRESHOLDS.digestThrottleSeconds * 1000
        if (Number.isFinite(lastAt) && Date.now() - lastAt < throttleMs) return

        const recipients = (await this.emailRepository.listRecipients())
            .filter((recipient) => recipient.role === OWNER_ROLE_ID)
        if (recipients.length === 0) return

        for (const recipient of recipients) {
            try {
                await this.email.queueDirect({
                    toEmail: recipient.email,
                    toName: recipient.name,
                    subject: `${WORKSPACE_NAME}: ${alarm.key.replaceAll('_', ' ')}`,
                    body: `${alarm.sentence}\n\n${alarm.detail}`,
                })
            } catch (error) {
                log.warning('alarm digest could not be queued', { alarm: alarm.key, error: String(error) })
            }
        }

        await this.settings.setRaw(key, String(Date.now()))
    }
}
