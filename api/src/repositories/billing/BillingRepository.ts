import { inject, injectable } from 'tsyringe'
import { err, ok, type Result } from '@toolcase/base'
import { Database, type QueryRunner } from '../../Database.js'
import { BaseRepository } from '@toolcase/node'
import { repositoryOptions } from '../../logging.js'
import type {
    CouponRow,
    InvoiceRow,
    PlanRow,
    SalesEnquiryEventRow,
    SalesEnquiryRow,
    SubscriptionRow,
} from '../../schema/billing.js'

import COUNT_ENQUIRIES from './sql/count-enquiries.sql'
import COUNT_INVOICES from './sql/count-invoices.sql'
import INSERT_ENQUIRY from './sql/insert-enquiry.sql'
import INSERT_ENQUIRY_EVENT from './sql/insert-enquiry-event.sql'
import SELECT_ENQUIRY_EVENTS from './sql/select-enquiry-events.sql'
import SELECT_ENQUIRIES from './sql/select-enquiries.sql'
import SELECT_ENQUIRY from './sql/select-enquiry.sql'
import SELECT_OPEN_ENQUIRY_FOR_USER from './sql/select-open-enquiry-for-user.sql'
import DELETE_COUPON from './sql/delete-coupon.sql'
import INSERT_COUPON from './sql/insert-coupon.sql'
import INSERT_INVOICE_REMINDER from './sql/insert-invoice-reminder.sql'
import INSERT_USAGE_EVENT from './sql/insert-usage-event.sql'
import REDEEM_COUPON from './sql/redeem-coupon.sql'
import SELECT_COUPONS from './sql/select-coupons.sql'
import SELECT_COUPON_BY_CODE from './sql/select-coupon-by-code.sql'
import SELECT_DUE_INVOICES from './sql/select-due-invoices.sql'
import SELECT_USAGE_SUMMARY from './sql/select-usage-summary.sql'
import SELECT_INVOICE_BY_TOKEN from './sql/select-invoice-by-token.sql'
import UPDATE_ENQUIRY_STATUS from './sql/update-enquiry-status.sql'
import COUNT_PLAN_SUBSCRIBERS from './sql/count-plan-subscribers.sql'
import INSERT_INVOICE from './sql/insert-invoice.sql'
import SELECT_INVOICE from './sql/select-invoice.sql'
import SELECT_INVOICES from './sql/select-invoices.sql'
import UPDATE_INVOICE_STATUS from './sql/update-invoice-status.sql'
import DELETE_PLAN from './sql/delete-plan.sql'
import INSERT_PLAN from './sql/insert-plan.sql'
import SELECT_ACTIVE_PLANS from './sql/select-active-plans.sql'
import SELECT_ALL_PLANS from './sql/select-all-plans.sql'
import UPDATE_PLAN from './sql/update-plan.sql'
import SELECT_EXPIRED_SUBSCRIPTIONS from './sql/select-expired-subscriptions.sql'
import SELECT_PLAN from './sql/select-plan.sql'
import SELECT_PLAN_BY_PROVIDER_PRODUCT_ID from './sql/select-plan-by-provider-product-id.sql'
import SELECT_SUBSCRIPTION from './sql/select-subscription.sql'
import SELECT_SUBSCRIPTION_BY_PROVIDER_ID from './sql/select-subscription-by-provider-id.sql'
import SELECT_RECONCILE_SUBSCRIPTIONS from './sql/select-reconcile-subscriptions.sql'
import LOCK_SUBSCRIPTION from './sql/lock-subscription.sql'
import SELECT_INVOICE_BY_PROVIDER_ID from './sql/select-invoice-by-provider-id.sql'
import UPSERT_SUBSCRIPTION from './sql/upsert-subscription.sql'
import UPDATE_STORAGE_OVERAGE from './sql/update-storage-overage.sql'
import UPDATE_PLAN_OVERRIDE from './sql/update-plan-override.sql'

export type PlanWrite = {
    id: string
    name: string
    description: string
    roleId: string | null
    visibleRoleIds: string[]
    mode: PlanRow['mode']
    priceCents: number
    currency: string
    interval: PlanRow['interval']
    position: number
    active: boolean
    features: string[]
    salesFields: PlanRow['sales_fields']
    trialDays: number
    providerProductId: string
}

export type PlanPatch = {
    name?: string
    description?: string
    roleId?: string | null
    visibleRoleIds?: string[]
    mode?: PlanRow['mode']
    priceCents?: number
    currency?: string
    interval?: PlanRow['interval']
    position?: number
    active?: boolean
    features?: string[]
    salesFields?: PlanRow['sales_fields']
    trialDays?: number
    providerProductId?: string
}

export type InvoiceWrite = {
    id: string
    number: string
    publicToken: string
    userId: string
    planId: string | null
    status: InvoiceRow['status']
    provider: InvoiceRow['provider']
    providerInvoiceId: string
    amountCents: number
    discountCents?: number
    creditCents?: number
    currency: string
    dueAt: Date | null
    paidAt: Date | null
}

export type InvoiceQuery = {
    userId: string | null
    planId: string | null
    status: string | null
    provider: string | null
    from: Date | null
    to: Date | null
    q: string | null
    limit: number
    offset: number
}

export type SubscriptionWrite = {
    userId: string
    planId: string | null
    status: SubscriptionRow['status']
    provider: SubscriptionRow['provider']
    providerCustomerId: string
    providerSubscriptionId: string
    providerUpdatedAt?: Date | null
    cancelAtPeriodEnd: boolean
    currentPeriodEnd: Date | null
    startedAt: Date | null
}

const UNIQUE_VIOLATION = '23505'

export type EnquiryCreateConflict = 'open'

@injectable()
export class BillingRepository extends BaseRepository<unknown, QueryRunner> {
    constructor(@inject(Database) database: Database) {
        super(database.pool, 'billing', 'id', repositoryOptions)
    }

    async listActivePlans(trx?: QueryRunner): Promise<PlanRow[]> {
        return this.time('listActivePlans', async () => {
            const { rows } = await this.run(trx).query<PlanRow>(SELECT_ACTIVE_PLANS)
            return rows
        })
    }

    async listAllPlans(trx?: QueryRunner): Promise<PlanRow[]> {
        return this.time('listAllPlans', async () => {
            const { rows } = await this.run(trx).query<PlanRow>(SELECT_ALL_PLANS)
            return rows
        })
    }

    async insertPlan(write: PlanWrite, trx?: QueryRunner): Promise<PlanRow | undefined> {
        return this.time('insertPlan', async () => {
            await this.run(trx).query(INSERT_PLAN, [
                write.id,
                write.name,
                write.description,
                write.roleId,
                JSON.stringify(write.visibleRoleIds),
                write.mode,
                write.priceCents,
                write.currency,
                write.interval,
                write.position,
                write.active,
                JSON.stringify(write.features),
                JSON.stringify(write.salesFields),
                write.trialDays,
                write.providerProductId,
            ])
            return this.findPlan(write.id, trx)
        })
    }

    async updatePlan(id: string, patch: PlanPatch, trx?: QueryRunner): Promise<PlanRow | undefined> {
        return this.time('updatePlan', async () => {
            const result = await this.run(trx).query(UPDATE_PLAN, [
                id,
                patch.name ?? null,
                patch.description ?? null,
                patch.roleId !== undefined,
                patch.roleId ?? null,
                patch.visibleRoleIds === undefined ? null : JSON.stringify(patch.visibleRoleIds),
                patch.mode ?? null,
                patch.priceCents ?? null,
                patch.currency ?? null,
                patch.interval ?? null,
                patch.position ?? null,
                patch.active ?? null,
                patch.features === undefined ? null : JSON.stringify(patch.features),
                patch.salesFields === undefined ? null : JSON.stringify(patch.salesFields),
                patch.trialDays ?? null,
                patch.providerProductId ?? null,
            ])
            if ((result.rowCount ?? 0) === 0) return undefined
            return this.findPlan(id, trx)
        })
    }

    async findPlanByProviderProductId(providerProductId: string, trx?: QueryRunner): Promise<PlanRow | undefined> {
        return this.time('findPlanByProviderProductId', async () => {
            const { rows } = await this.run(trx).query<PlanRow>(SELECT_PLAN_BY_PROVIDER_PRODUCT_ID, [providerProductId])
            return rows[0]
        })
    }

    async deletePlan(id: string, trx?: QueryRunner): Promise<boolean> {
        return this.time('deletePlan', async () => {
            const result = await this.run(trx).query(DELETE_PLAN, [id])
            return (result.rowCount ?? 0) > 0
        })
    }

    async countPlanSubscribers(id: string, trx?: QueryRunner): Promise<number> {
        return this.time('countPlanSubscribers', async () => {
            const { rows } = await this.run(trx).query<{ c: string }>(COUNT_PLAN_SUBSCRIBERS, [id])
            return Number(rows[0]?.c ?? 0)
        })
    }

    async findPlan(id: string, trx?: QueryRunner): Promise<PlanRow | undefined> {
        return this.time('findPlan', async () => {
            const { rows } = await this.run(trx).query<PlanRow>(SELECT_PLAN, [id])
            return rows[0]
        })
    }

    async findSubscription(userId: string, trx?: QueryRunner): Promise<SubscriptionRow | undefined> {
        return this.time('findSubscription', async () => {
            const { rows } = await this.run(trx).query<SubscriptionRow>(SELECT_SUBSCRIPTION, [userId])
            return rows[0]
        })
    }

    async flagStorageOverage(userId: string, bytes: number, trx?: QueryRunner): Promise<void> {
        await this.run(trx).query(UPDATE_STORAGE_OVERAGE, [userId, Math.max(0, Math.floor(bytes))])
    }

    async setPlanOverride(userId: string, planId: string | null, trx?: QueryRunner): Promise<void> {
        await this.run(trx).query(UPDATE_PLAN_OVERRIDE, [userId, planId])
    }

    async saveSubscription(write: SubscriptionWrite, trx?: QueryRunner): Promise<SubscriptionRow> {
        return this.time('saveSubscription', async () => {
            await this.run(trx).query(UPSERT_SUBSCRIPTION, [
                write.userId,
                write.planId,
                write.status,
                write.provider,
                write.providerCustomerId,
                write.providerSubscriptionId,
                write.providerUpdatedAt ?? null,
                write.cancelAtPeriodEnd,
                write.currentPeriodEnd,
                write.startedAt,
            ])
            const saved = await this.findSubscription(write.userId, trx)
            if (!saved) throw new Error('subscription row missing after upsert')
            return saved
        })
    }

    async lockSubscription(userId: string, trx: QueryRunner): Promise<SubscriptionRow | undefined> {
        return this.time('lockSubscription', async () => {
            const { rows } = await this.run(trx).query<SubscriptionRow>(LOCK_SUBSCRIPTION, [userId])
            return rows[0]
        })
    }

    async findSubscriptionByProviderId(
        provider: string,
        providerSubscriptionId: string,
        trx?: QueryRunner
    ): Promise<SubscriptionRow | undefined> {
        return this.time('findSubscriptionByProviderId', async () => {
            const { rows } = await this.run(trx).query<SubscriptionRow>(SELECT_SUBSCRIPTION_BY_PROVIDER_ID, [
                provider, providerSubscriptionId,
            ])
            return rows[0]
        })
    }

    async listReconcileCandidates(trx?: QueryRunner): Promise<SubscriptionRow[]> {
        return this.time('listReconcileCandidates', async () => {
            const { rows } = await this.run(trx).query<SubscriptionRow>(SELECT_RECONCILE_SUBSCRIPTIONS)
            return rows
        })
    }

    async insertInvoice(write: InvoiceWrite, trx?: QueryRunner): Promise<InvoiceRow | undefined> {
        return this.time('insertInvoice', async () => {
            const { rows } = await this.run(trx).query<{ id: string }>(INSERT_INVOICE, [
                write.id,
                write.number,
                write.publicToken,
                write.userId,
                write.planId,
                write.status,
                write.provider,
                write.providerInvoiceId,
                write.amountCents,
                write.discountCents ?? 0,
                write.creditCents ?? 0,
                write.currency,
                write.dueAt,
                write.paidAt,
            ])
            if (rows.length > 0) return this.findInvoice(rows[0].id, trx)
            if (!write.providerInvoiceId) return undefined
            return this.findInvoiceByProviderId(write.provider, write.providerInvoiceId, trx)
        })
    }

    async findInvoiceByProviderId(
        provider: string,
        providerInvoiceId: string,
        trx?: QueryRunner
    ): Promise<InvoiceRow | undefined> {
        return this.time('findInvoiceByProviderId', async () => {
            const { rows } = await this.run(trx).query<InvoiceRow>(SELECT_INVOICE_BY_PROVIDER_ID, [
                provider, providerInvoiceId,
            ])
            return rows[0]
        })
    }

    async findInvoice(id: string, trx?: QueryRunner): Promise<InvoiceRow | undefined> {
        return this.time('findInvoice', async () => {
            const { rows } = await this.run(trx).query<InvoiceRow>(SELECT_INVOICE, [id])
            return rows[0]
        })
    }

    async listInvoices(query: InvoiceQuery, trx?: QueryRunner): Promise<InvoiceRow[]> {
        return this.time('listInvoices', async () => {
            const { rows } = await this.run(trx).query<InvoiceRow>(SELECT_INVOICES, [
                query.userId, query.planId, query.status, query.provider,
                query.from, query.to, query.q, query.limit, query.offset,
            ])
            return rows
        })
    }

    async countInvoices(query: InvoiceQuery, trx?: QueryRunner): Promise<number> {
        return this.time('countInvoices', async () => {
            const { rows } = await this.run(trx).query<{ c: string }>(COUNT_INVOICES, [
                query.userId, query.planId, query.status, query.provider,
                query.from, query.to, query.q,
            ])
            return Number(rows[0]?.c ?? 0)
        })
    }

    async updateInvoiceStatus(id: string, status: InvoiceRow['status'], trx?: QueryRunner): Promise<InvoiceRow | undefined> {
        return this.time('updateInvoiceStatus', async () => {
            const result = await this.run(trx).query(UPDATE_INVOICE_STATUS, [id, status])
            if ((result.rowCount ?? 0) === 0) return undefined
            return this.findInvoice(id, trx)
        })
    }

    async findInvoiceByToken(token: string, trx?: QueryRunner): Promise<InvoiceRow | undefined> {
        return this.time('findInvoiceByToken', async () => {
            const { rows } = await this.run(trx).query<InvoiceRow>(SELECT_INVOICE_BY_TOKEN, [token])
            return rows[0]
        })
    }

    async insertEnquiry(
        write: { id: string; planId: string | null; userId: string; status: SalesEnquiryRow['status']; answers: Record<string, string> },
        trx?: QueryRunner
    ): Promise<Result<SalesEnquiryRow | undefined, EnquiryCreateConflict>> {
        return this.time('insertEnquiry', async () => {
            try {
                await this.run(trx).query(INSERT_ENQUIRY, [
                    write.id, write.planId, write.userId, write.status, JSON.stringify(write.answers),
                ])
            } catch (error) {
                if ((error as { code?: string }).code === UNIQUE_VIOLATION) return err('open')
                throw error
            }
            return ok(await this.findEnquiry(write.id, trx))
        })
    }

    async findOpenEnquiryForUser(userId: string, trx?: QueryRunner): Promise<SalesEnquiryRow | undefined> {
        return this.time('findOpenEnquiryForUser', async () => {
            const { rows } = await this.run(trx).query<SalesEnquiryRow>(SELECT_OPEN_ENQUIRY_FOR_USER, [userId])
            return rows[0]
        })
    }

    async findEnquiry(id: string, trx?: QueryRunner): Promise<SalesEnquiryRow | undefined> {
        return this.time('findEnquiry', async () => {
            const { rows } = await this.run(trx).query<SalesEnquiryRow>(SELECT_ENQUIRY, [id])
            return rows[0]
        })
    }

    async listEnquiries(
        query: { status: string | null; planId: string | null; q: string | null; limit: number; offset: number },
        trx?: QueryRunner
    ): Promise<SalesEnquiryRow[]> {
        return this.time('listEnquiries', async () => {
            const { rows } = await this.run(trx).query<SalesEnquiryRow>(SELECT_ENQUIRIES, [
                query.status, query.planId, query.q, query.limit, query.offset,
            ])
            return rows
        })
    }

    async countEnquiries(
        query: { status: string | null; planId: string | null; q: string | null },
        trx?: QueryRunner
    ): Promise<number> {
        return this.time('countEnquiries', async () => {
            const { rows } = await this.run(trx).query<{ c: string }>(COUNT_ENQUIRIES, [
                query.status, query.planId, query.q,
            ])
            return Number(rows[0]?.c ?? 0)
        })
    }

    async updateEnquiryStatus(id: string, status: SalesEnquiryRow['status'], trx?: QueryRunner): Promise<SalesEnquiryRow | undefined> {
        return this.time('updateEnquiryStatus', async () => {
            const result = await this.run(trx).query(UPDATE_ENQUIRY_STATUS, [id, status])
            if ((result.rowCount ?? 0) === 0) return undefined
            return this.findEnquiry(id, trx)
        })
    }

    async insertEnquiryEvent(
        write: {
            id: string
            enquiryId: string
            actorId: string | null
            actorName: string
            kind: SalesEnquiryEventRow['kind']
            status: SalesEnquiryEventRow['status']
            note: string
            invoiceId: string | null
        },
        trx?: QueryRunner
    ): Promise<void> {
        await this.run(trx).query(INSERT_ENQUIRY_EVENT, [
            write.id, write.enquiryId, write.actorId, write.actorName,
            write.kind, write.status, write.note, write.invoiceId,
        ])
    }

    async listEnquiryEvents(enquiryId: string, trx?: QueryRunner): Promise<SalesEnquiryEventRow[]> {
        return this.time('listEnquiryEvents', async () => {
            const { rows } = await this.run(trx).query<SalesEnquiryEventRow>(SELECT_ENQUIRY_EVENTS, [enquiryId])
            return rows
        })
    }

    async listExpired(trx?: QueryRunner): Promise<SubscriptionRow[]> {
        return this.time('listExpired', async () => {
            const { rows } = await this.run(trx).query<SubscriptionRow>(SELECT_EXPIRED_SUBSCRIPTIONS)
            return rows
        })
    }

    async insertCoupon(
        write: {
            id: string
            code: string
            percentOff: number | null
            amountOff: number | null
            currency: string
            durationMonths: number
            maxRedemptions: number | null
            expiresAt: Date | null
            active: boolean
        },
        trx?: QueryRunner
    ): Promise<CouponRow> {
        const { rows } = await this.run(trx).query<CouponRow>(INSERT_COUPON, [
            write.id, write.code, write.percentOff, write.amountOff, write.currency,
            write.durationMonths, write.maxRedemptions, write.expiresAt, write.active,
        ])
        return rows[0]
    }

    async listCoupons(trx?: QueryRunner): Promise<CouponRow[]> {
        return this.time('listCoupons', async () => {
            const { rows } = await this.run(trx).query<CouponRow>(SELECT_COUPONS)
            return rows
        })
    }

    async findCouponByCode(code: string, trx?: QueryRunner): Promise<CouponRow | undefined> {
        return this.time('findCouponByCode', async () => {
            const { rows } = await this.run(trx).query<CouponRow>(SELECT_COUPON_BY_CODE, [code])
            return rows[0]
        })
    }

    async deleteCoupon(id: string, trx?: QueryRunner): Promise<boolean> {
        return this.time('deleteCoupon', async () => {
            const result = await this.run(trx).query(DELETE_COUPON, [id])
            return (result.rowCount ?? 0) > 0
        })
    }

    async redeemCoupon(
        write: { id: string; couponId: string; userId: string; invoiceId: string | null },
        trx?: QueryRunner
    ): Promise<CouponRow | undefined> {
        return this.time('redeemCoupon', async () => {
            const { rows } = await this.run(trx).query<CouponRow>(REDEEM_COUPON, [
                write.id, write.couponId, write.userId, write.invoiceId,
            ])
            return rows[0]
        })
    }

    async insertUsageEvent(
        write: { id: string; userId: string; resource: string; quantity: number; occurredAt: Date | null },
        trx?: QueryRunner
    ): Promise<void> {
        return this.time('insertUsageEvent', async () => {
            await this.run(trx).query(INSERT_USAGE_EVENT, [
                write.id, write.userId, write.resource, write.quantity, write.occurredAt,
            ])
        })
    }

    async usageSummary(
        userId: string,
        from: Date,
        to: Date,
        trx?: QueryRunner
    ): Promise<Array<{ resource: string; total: number }>> {
        return this.time('usageSummary', async () => {
            const { rows } = await this.run(trx).query<{ resource: string; total: number }>(
                SELECT_USAGE_SUMMARY,
                [userId, from, to]
            )
            return rows
        })
    }

    async dueInvoices(afterDays: number, stage: number, trx?: QueryRunner): Promise<InvoiceRow[]> {
        return this.time('dueInvoices', async () => {
            const { rows } = await this.run(trx).query<InvoiceRow>(SELECT_DUE_INVOICES, [afterDays, stage])
            return rows
        })
    }

    async recordReminder(id: string, invoiceId: string, stage: number, trx?: QueryRunner): Promise<void> {
        return this.time('recordReminder', async () => {
            await this.run(trx).query(INSERT_INVOICE_REMINDER, [id, invoiceId, stage])
        })
    }
}
