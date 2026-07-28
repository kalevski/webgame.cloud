import container from './container.js'
import { previousRun, registerJobHandler, scheduledRegistrations } from './domain/jobs.js'
import { getLogger } from './logging.js'
import { BillingService } from './services/BillingService.js'
import { JobService } from './services/JobService.js'
import { SessionRepository } from './repositories/users/SessionRepository.js'
import { WebhookService } from './services/WebhookService.js'
import { UploadService } from './services/UploadService.js'
import { BuildService } from './services/BuildService.js'
import {
    JOB_REALM_MIGRATE,
    JOB_REALM_PURGE,
    JOB_REALM_REAP_MIGRATIONS,
    RealmService,
} from './services/RealmService.js'

const log = getLogger('scheduler')

export const JOB_SESSION_PURGE = 'session_purge'
export const JOB_SUBSCRIPTION_EXPIRY = 'subscription_expiry'
export const JOB_WEBHOOK_DELIVERY = 'webhook_delivery'
export const JOB_ASSET_REAP_ORPHANS = 'assets.reap_orphans'
export const JOB_BUILD_REAP_STALE = 'builds.reap_stale'

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

    registerJobHandler(
        JOB_REALM_MIGRATE,
        async (payload) => {
            await container.resolve(RealmService).runMigration(String(payload.migrationId ?? ''))
        },
        { description: 'Drive one project migration between realms. Queued by a staff move.' }
    )

    registerJobHandler(
        JOB_REALM_PURGE,
        async (payload) => {
            const paths = Array.isArray(payload.paths) ? payload.paths.map(String) : []
            await container.resolve(RealmService).purgeOnRealm(String(payload.realmId ?? ''), paths)
        },
        { description: 'Delete files on a realm after the rows they belong to were deleted.' }
    )

    registerJobHandler(
        JOB_ASSET_REAP_ORPHANS,
        async () => {
            await container.resolve(UploadService).reapOrphans()
        },
        { cron: '*/5 * * * *', description: 'Soft-delete uploads that never landed on their realm.' }
    )

    registerJobHandler(
        JOB_BUILD_REAP_STALE,
        async () => {
            await container.resolve(BuildService).reapStale()
        },
        { cron: '*/5 * * * *', description: 'Fail builds a realm claimed and never reported on.' }
    )

    registerJobHandler(
        JOB_REALM_REAP_MIGRATIONS,
        async () => {
            await container.resolve(RealmService).reapStaleMigrations()
        },
        { cron: '*/5 * * * *', description: 'Fail migrations stuck in a non-terminal state, releasing the project lock.' }
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
