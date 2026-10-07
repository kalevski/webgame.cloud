import { inject, injectable } from 'tsyringe'
import { randomUUID } from 'node:crypto'
import type { BillingEvent, BillingEventFilters, BillingEventStatus, BillingProvider } from '../contracts/index.js'
import { ACTIVE_SUBSCRIPTION_STATUSES } from '../contracts/index.js'
import { Database } from '../Database.js'
import { getBillingPort, type ParsedBillingEvent } from '../domain/billing.js'
import { NotFoundError } from '../domain/errors.js'
import { reportError } from '../domain/observability.js'
import { recordAudit } from '../audit.js'
import { JOB_BILLING_EVENT_APPLY } from '../jobs.js'
import { BillingEventRepository } from '../repositories/billing/BillingEventRepository.js'
import { BillingRepository } from '../repositories/billing/BillingRepository.js'
import { UserRepository } from '../repositories/users/UserRepository.js'
import { toBillingEvent, type BillingEventRow, type SubscriptionRow } from '../schema/billing.js'
import { BillingService } from './BillingService.js'
import { JobService } from './JobService.js'
import { NotificationService } from './NotificationService.js'
import { getLogger } from '../logging.js'

const log = getLogger('billing-events')

const isActive = (status: SubscriptionRow['status']): boolean =>
    (ACTIVE_SUBSCRIPTION_STATUSES as readonly string[]).includes(status)

type ApplyOutcome = { status: BillingEventStatus; error: string }

type ParsedSubscriptionPatch = NonNullable<ParsedBillingEvent['subscription']>


@injectable()
export class BillingEventService {
    constructor(
        @inject(BillingEventRepository) private events: BillingEventRepository,
        @inject(BillingRepository) private billing: BillingRepository,
        @inject(UserRepository) private users: UserRepository,
        @inject(BillingService) private billingService: BillingService,
        @inject(NotificationService) private notifications: NotificationService,
        @inject(JobService) private jobs: JobService,
        @inject(Database) private db: Database
    ) {}

    async receive(provider: BillingProvider, event: ParsedBillingEvent, payload: unknown): Promise<void> {
        const created = await this.events.insertEvent({
            id: randomUUID(),
            provider,
            providerEventId: event.id,
            eventType: event.type,
            providerSubscriptionId: event.subscriptionId ?? '',
            userId: event.userId,
            objectAt: event.objectAt,
            payload,
        })
        if (!created) return

        await this.jobs.enqueue({
            kind: JOB_BILLING_EVENT_APPLY,
            payload: { eventId: created.id },
            uniqueKey: `billing_event:${created.id}`,
        })
    }

    async apply(eventId: string): Promise<void> {
        const row = await this.events.findById(eventId)
        if (!row || row.status !== 'received') return

        try {
            const outcome = await this.applyRow(row)
            await this.events.markStatus(row.id, outcome.status, outcome.error)
        } catch (error) {
            await this.events.markStatus(row.id, 'failed', String(error))
            reportError(error, { source: 'billing_event_apply', requestId: row.id })
            throw error
        }
    }

    async replay(eventId: string): Promise<BillingEvent> {
        const reset = await this.events.reset(eventId)
        if (!reset) throw new NotFoundError('billing_event_not_found', 'billing event not found', [eventId])

        await this.jobs.enqueue({
            kind: JOB_BILLING_EVENT_APPLY,
            payload: { eventId },
            uniqueKey: `billing_event_replay:${eventId}:${reset.attempts}`,
        })
        return toBillingEvent(reset)
    }

    async list(filters: BillingEventFilters): Promise<{ events: BillingEvent[]; total: number }> {
        const query = {
            status: filters.status ?? null,
            eventType: filters.eventType ?? null,
            userId: filters.userId ?? null,
            q: filters.q?.trim() || null,
            limit: Math.min(filters.limit ?? 50, 200),
            offset: Math.max(filters.offset ?? 0, 0),
        }
        const [rows, total] = await Promise.all([
            this.events.list(query),
            this.events.countEvents(query),
        ])
        return { events: rows.map(toBillingEvent), total }
    }

    async reconcile(): Promise<number> {
        const candidates = await this.billing.listReconcileCandidates()
        let repaired = 0

        for (const row of candidates) {
            const port = getBillingPort(row.provider)
            if (!port) continue

            const snapshot = await port.fetchSubscription(row.provider_subscription_id).catch((error) => {
                log.warning('reconcile fetch failed', { userId: row.user_id, provider: row.provider, error: String(error) })
                return null
            })
            if (!snapshot) continue

            const unchanged =
                snapshot.status === row.status &&
                snapshot.cancelAtPeriodEnd === row.cancel_at_period_end &&
                (snapshot.currentPeriodEnd?.getTime() ?? null) === (row.current_period_end?.getTime() ?? null)
            if (unchanged) continue

            log.warning('reconcile found a subscription the last webhook missed', { userId: row.user_id, provider: row.provider })
            const applied = await this.writeSubscription(
                row.user_id,
                row.provider,
                row.provider_subscription_id,
                {
                    status: snapshot.status,
                    providerCustomerId: snapshot.providerCustomerId || row.provider_customer_id,
                    providerProductId: snapshot.providerProductId || null,
                    cancelAtPeriodEnd: snapshot.cancelAtPeriodEnd,
                    currentPeriodEnd: snapshot.currentPeriodEnd,
                },
                snapshot.objectAt,
                null
            )
            if (applied) repaired += 1
        }

        return repaired
    }

    private async applyRow(row: BillingEventRow): Promise<ApplyOutcome> {
        const port = getBillingPort(row.provider)
        if (!port) return { status: 'ignored', error: 'provider_not_registered' }

        const event = port.parseWebhookPayload(row.payload)

        const userId = row.user_id
            ?? (row.provider_subscription_id
                ? (await this.billing.findSubscriptionByProviderId(row.provider, row.provider_subscription_id))?.user_id ?? null
                : null)
        if (!userId) return { status: 'ignored', error: row.provider_subscription_id ? 'unknown_subscription' : 'unknown_account' }

        if (!event.subscription) {
            if (!event.invoice) return { status: 'ignored', error: event.ignoredReason ?? 'event_not_handled' }

            const invoice = await this.billingService.mirrorProviderInvoice({
                userId,
                planId: null,
                provider: row.provider,
                providerInvoiceId: event.invoice.providerInvoiceId,
                amountCents: event.invoice.amountCents,
                currency: event.invoice.currency,
                status: event.invoice.status,
            })
            if (invoice) await recordAudit(await this.actorFor(userId), 'billing_invoice_synced', invoice.id, invoice.status)
            return { status: 'applied', error: '' }
        }

        const applied = await this.writeSubscription(
            userId, row.provider, row.provider_subscription_id, event.subscription, event.objectAt, event.invoice
        )
        return applied ? { status: 'applied', error: '' } : { status: 'ignored', error: 'stale_event' }
    }

    private async writeSubscription(
        userId: string,
        provider: BillingProvider,
        providerSubscriptionId: string,
        patch: ParsedSubscriptionPatch,
        objectAt: Date,
        invoice: ParsedBillingEvent['invoice']
    ): Promise<boolean> {
        let stale = false
        let previousStatus: SubscriptionRow['status'] = 'none'
        let saved: SubscriptionRow | undefined

        await this.db.transaction(async (trx) => {
            const existing = await this.billing.lockSubscription(userId, trx)
            previousStatus = existing?.status ?? 'none'

            if (existing?.provider_updated_at && existing.provider_updated_at.getTime() >= objectAt.getTime()) {
                stale = true
                return
            }

            const plan = patch.providerProductId
                ? await this.billing.findPlanByProviderProductId(patch.providerProductId, trx)
                : undefined

            saved = await this.billing.saveSubscription({
                userId,
                planId: plan?.id ?? existing?.plan_id ?? null,
                status: patch.status,
                provider,
                providerCustomerId: patch.providerCustomerId || existing?.provider_customer_id || '',
                providerSubscriptionId: providerSubscriptionId || existing?.provider_subscription_id || '',
                providerUpdatedAt: objectAt,
                cancelAtPeriodEnd: patch.cancelAtPeriodEnd,
                currentPeriodEnd: patch.currentPeriodEnd,
                startedAt: existing?.started_at ?? (isActive(patch.status) ? new Date() : null),
            }, trx)

            if (invoice) {
                await this.billingService.mirrorProviderInvoice({
                    userId,
                    planId: saved.plan_id,
                    provider,
                    providerInvoiceId: invoice.providerInvoiceId,
                    amountCents: invoice.amountCents,
                    currency: invoice.currency,
                    status: invoice.status,
                }, trx)
            }
        })

        if (stale || !saved) return false

        await this.billingService.syncRole(userId, saved)
        await recordAudit(await this.actorFor(userId), 'subscription_synced', userId, `${saved.status}`)
        await this.notifyTransition(userId, previousStatus, saved.status)
        return true
    }

    private async actorFor(userId: string) {
        const user = await this.users.findById(userId)
        if (!user) throw new NotFoundError('user_not_found', 'user not found', [userId])
        return user
    }

    private async notifyTransition(
        userId: string,
        previousStatus: SubscriptionRow['status'],
        nextStatus: SubscriptionRow['status']
    ): Promise<void> {
        if (nextStatus === previousStatus) return

        if (isActive(nextStatus) && !isActive(previousStatus)) {
            await this.notifications.notify(userId, 'system', 'Your subscription payment was received.', '/billing')
            return
        }
        if (nextStatus === 'past_due') {
            await this.notifications.notify(userId, 'system', 'Your subscription payment could not be processed.', '/billing')
            return
        }
        if (nextStatus === 'canceled') {
            await this.notifications.notify(userId, 'system', 'Your subscription has ended.', '/billing')
        }
    }
}
