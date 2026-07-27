import container from './container.js'
import { previousRun, registerJobHandler, scheduledRegistrations } from './domain/jobs.js'
import { getLogger } from './logging.js'
import { BillingService } from './services/BillingService.js'
import { JobService } from './services/JobService.js'
import { SessionRepository } from './repositories/users/SessionRepository.js'
import { WebhookService } from './services/WebhookService.js'

const log = getLogger('scheduler')

export const JOB_SESSION_PURGE = 'session_purge'
export const JOB_SUBSCRIPTION_EXPIRY = 'subscription_expiry'
export const JOB_WEBHOOK_DELIVERY = 'webhook_delivery'

export const registerJobHandlers = (): void => {
    registerJobHandler(
        JOB_SESSION_PURGE,
        async () => {
            await container.resolve(SessionRepository).deleteExpired()
        },
        { cron: '0 * * * *', description: 'Delete expired sessions.' }
    )

    registerJobHandler(
        JOB_SUBSCRIPTION_EXPIRY,
        async () => {
            await container.resolve(BillingService).expireDue()
        },
        { cron: '10 * * * *', description: 'End subscriptions whose paid period has run out.' }
    )

    registerJobHandler(
        JOB_WEBHOOK_DELIVERY,
        async (payload) => {
            await container.resolve(WebhookService).deliver(String(payload.deliveryId ?? ''))
        },
        { description: 'Deliver one webhook payload. Queued by the audit trail, never scheduled.' }
    )
}

const lastEnqueued = new Map<string, string>()

export const occurrenceKey = (kind: string, occurrence: Date): string =>
    `${kind}:${occurrence.toISOString()}`

export const enqueueDueSchedules = async (now: Date = new Date()): Promise<number> => {
    const jobs = container.resolve(JobService)
    let enqueued = 0

    for (const registration of scheduledRegistrations()) {
        const occurrence = previousRun(registration.cron, now)
        if (!occurrence) {
            log.warning('schedule has an unusable cron expression', {
                kind: registration.kind,
                cron: registration.cron,
            })
            continue
        }

        const key = occurrenceKey(registration.kind, occurrence)
        if (lastEnqueued.get(registration.kind) === key) continue

        try {
            await jobs.enqueue({ kind: registration.kind, uniqueKey: key })
            lastEnqueued.set(registration.kind, key)
            enqueued += 1
        } catch (error) {
            log.error('failed to enqueue scheduled job', { kind: registration.kind, error: String(error) })
        }
    }

    return enqueued
}
