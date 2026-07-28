import { inject, injectable } from 'tsyringe'
import { randomUUID } from 'node:crypto'
import type {
    BillingProvider,
    CheckoutIntent,
    Coupon,
    CouponDraft,
    EnquiryActionDraft,
    EnquiryActionResult,
    EnquiryFilters,
    EnquiryStatus,
    Invoice,
    InvoiceDraft,
    InvoiceFilters,
    InvoiceStatus,
    Plan,
    PlanDraft,
    PublicConstants,
    PublicInvoice,
    SalesEnquiry,
    SalesEnquiryDraft,
    SalesEnquiryEvent,
    Subscription,
    SubscriptionPatch,
    SubscriptionStatus,
    UsageSummary,
    User,
} from '../contracts/index.js'
import { ACTIVE_SUBSCRIPTION_STATUSES, NO_SUBSCRIPTION, OWNER_ROLE_ID, toRoleId } from '../contracts/index.js'
import { WEB_URL, WORKSPACE_NAME } from '../env.js'
import { getBillingPort, manualBillingPort, type ProviderSubscription } from '../domain/billing.js'
import { ConflictError, NotFoundError, ValidationError } from '../domain/errors.js'
import { BillingRepository } from '../repositories/billing/BillingRepository.js'
import { UserRepository } from '../repositories/users/UserRepository.js'
import {
    toCoupon,
    toInvoice,
    toPlan,
    toSalesEnquiry,
    toSalesEnquiryEvent,
    toSubscription,
    type SubscriptionRow,
} from '../schema/billing.js'
import { AccessPolicyService } from './AccessPolicyService.js'
import { FeatureService } from './FeatureService.js'
import { SettingsService } from './SettingsService.js'
import { EmailService } from './EmailService.js'
import { getLogger } from '../logging.js'

const log = getLogger('billing')

const asProviderSubscription = (row: SubscriptionRow): ProviderSubscription => ({
    status: row.status,
    providerCustomerId: row.provider_customer_id,
    providerSubscriptionId: row.provider_subscription_id,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: row.cancel_at_period_end,
})

const isActive = (status: SubscriptionStatus): boolean =>
    ACTIVE_SUBSCRIPTION_STATUSES.includes(status)

const invoiceNumber = (issued: Date): string => {
    const stamp = `${issued.getUTCFullYear()}${String(issued.getUTCMonth() + 1).padStart(2, '0')}`
    return `INV-${stamp}-${randomUUID().slice(0, 8).toUpperCase()}`
}

const parseDate = (value: string | null | undefined): Date | null =>
    value ? new Date(value) : null


const DUNNING_STAGES = [
    { stage: 1, afterDays: 1 },
    { stage: 2, afterDays: 7 },
    { stage: 3, afterDays: 21 },
]

const startOfMonth = (): Date => {
    const now = new Date()
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
}

const discountFor = (
    coupon: { percent_off: number | null; amount_off: number | null },
    amountCents: number
): number => {
    if (coupon.percent_off) return Math.round((amountCents * coupon.percent_off) / 100)
    return Math.min(amountCents, coupon.amount_off ?? 0)
}

@injectable()
export class BillingService {
    constructor(
        @inject(BillingRepository) private billing: BillingRepository,
        @inject(UserRepository) private users: UserRepository,
        @inject(AccessPolicyService) private access: AccessPolicyService,
        @inject(SettingsService) private settings: SettingsService,
        @inject(FeatureService) private features: FeatureService,
        @inject(EmailService) private email: EmailService
    ) {}

    private port(provider: BillingProvider = 'manual') {
        return getBillingPort(provider) ?? manualBillingPort
    }

    private async managedProvider(): Promise<BillingProvider | null> {
        const configured = (await this.settings.getRaw('billing_provider')) as BillingProvider | undefined
        if (!configured || configured === 'manual') return null
        return getBillingPort(configured) ? configured : null
    }

    async listPlans(): Promise<Plan[]> {
        return (await this.billing.listActivePlans()).map(toPlan)
    }

    async listAllPlans(): Promise<Plan[]> {
        return (await this.billing.listAllPlans()).map(toPlan)
    }

    async createPlan(draft: PlanDraft): Promise<Plan> {
        const name = draft.name.trim()
        if (!name) throw new ValidationError('plan_name_required', 'a plan name is required')

        const id = toRoleId(draft.id?.trim() || name)
        if (!id) throw new ValidationError('plan_name_required', 'a plan name is required')
        if (await this.billing.findPlan(id)) {
            throw new ConflictError('plan_exists', 'a plan with that id already exists', [id])
        }

        const created = await this.billing.insertPlan({
            id,
            name,
            description: draft.description?.trim() ?? '',
            roleId: draft.roleId ?? null,
            mode: draft.mode ?? 'manual',
            priceCents: draft.priceCents ?? 0,
            currency: draft.currency?.trim() || 'USD',
            interval: draft.interval ?? 'month',
            position: draft.position ?? 0,
            active: draft.active ?? true,
            features: draft.features ?? [],
            salesFields: draft.salesFields ?? [],
        })
        if (!created) throw new NotFoundError('plan_not_found', 'plan not found', [id])
        return toPlan(created)
    }

    async updatePlan(id: string, draft: Partial<PlanDraft>): Promise<Plan> {
        if (draft.name !== undefined && !draft.name.trim()) {
            throw new ValidationError('plan_name_required', 'a plan name is required')
        }
        const updated = await this.billing.updatePlan(id, {
            name: draft.name?.trim(),
            description: draft.description?.trim(),
            roleId: draft.roleId,
            mode: draft.mode,
            priceCents: draft.priceCents,
            currency: draft.currency?.trim(),
            interval: draft.interval,
            position: draft.position,
            active: draft.active,
            features: draft.features,
            salesFields: draft.salesFields,
        })
        if (!updated) throw new NotFoundError('plan_not_found', 'plan not found', [id])
        return toPlan(updated)
    }

    async deletePlan(id: string): Promise<void> {
        const subscribers = await this.billing.countPlanSubscribers(id)
        if (subscribers > 0) {
            throw new ConflictError('plan_in_use', 'plan still has active subscribers', [id, subscribers])
        }
        if (!(await this.billing.deletePlan(id))) {
            throw new NotFoundError('plan_not_found', 'plan not found', [id])
        }
    }

    async getPlan(planId: string): Promise<Plan> {
        const row = await this.billing.findPlan(planId)
        if (!row || !row.active) throw new NotFoundError('plan_not_found', 'plan not found', [planId])
        return toPlan(row)
    }

    async getSubscription(userId: string): Promise<Subscription> {
        const row = await this.billing.findSubscription(userId)
        return row ? toSubscription(row) : NO_SUBSCRIPTION
    }

    async startCheckout(user: User, planId: string): Promise<CheckoutIntent> {
        const plan = await this.getPlan(planId)
        const current = await this.getSubscription(user.id)
        if (isActive(current.status) && current.planId === plan.id) {
            throw new ConflictError('already_subscribed', 'already subscribed to this plan')
        }

        const salesContact = (await this.settings.getRaw('sales_contact')) ?? ''
        const managed = plan.mode === 'managed' ? await this.managedProvider() : null

        if (plan.mode === 'managed' && !managed) {
            return {
                outcome: 'unavailable',
                provider: 'manual',
                planId: plan.id,
                redirectUrl: null,
                salesContact,
            }
        }

        const intent = await this.port(managed ?? 'manual').startCheckout({
            userId: user.id,
            userEmail: user.email,
            plan,
            successUrl: `${WEB_URL || ''}/profile/billing?checkout=success`,
            cancelUrl: `${WEB_URL || ''}/profile/billing?checkout=cancelled`,
            salesContact,
        })

        if (intent.outcome === 'activated') {
            const trialing = plan.trialDays > 0
            const periodEnd = trialing
                ? new Date(Date.now() + plan.trialDays * 24 * 60 * 60 * 1000)
                : undefined
            await this.applySubscription(user.id, {
                status: trialing ? 'trialing' : 'active',
                planId: plan.id,
                ...(periodEnd ? { currentPeriodEnd: periodEnd.toISOString() } : {}),
            })
        }
        return intent
    }

    async cancel(user: User): Promise<Subscription> {
        const row = await this.billing.findSubscription(user.id)
        if (!row || !isActive(row.status)) {
            throw new ConflictError('not_subscribed', 'no active subscription to cancel')
        }

        const next = await this.port(row.provider).cancel(asProviderSubscription(row))
        const saved = await this.billing.saveSubscription({
            userId: user.id,
            planId: row.plan_id,
            status: next.status,
            provider: row.provider,
            providerCustomerId: next.providerCustomerId,
            providerSubscriptionId: next.providerSubscriptionId,
            cancelAtPeriodEnd: next.cancelAtPeriodEnd,
            currentPeriodEnd: next.currentPeriodEnd,
            startedAt: row.started_at,
        })
        await this.syncRole(user.id, saved)
        return toSubscription(saved)
    }

    async applySubscription(userId: string, patch: SubscriptionPatch): Promise<Subscription> {
        const existing = await this.billing.findSubscription(userId)
        const planId = patch.planId === undefined ? existing?.plan_id ?? null : patch.planId
        if (planId) await this.getPlan(planId)

        const periodEnd = patch.currentPeriodEnd === undefined
            ? existing?.current_period_end ?? null
            : patch.currentPeriodEnd === null ? null : new Date(patch.currentPeriodEnd)

        const saved = await this.billing.saveSubscription({
            userId,
            planId,
            status: patch.status,
            provider: existing?.provider ?? 'manual',
            providerCustomerId: existing?.provider_customer_id ?? '',
            providerSubscriptionId: existing?.provider_subscription_id ?? '',
            cancelAtPeriodEnd: existing?.cancel_at_period_end ?? false,
            currentPeriodEnd: periodEnd,
            startedAt: isActive(patch.status) ? existing?.started_at ?? new Date() : existing?.started_at ?? null,
        })
        await this.syncRole(userId, saved)

        const activating = isActive(patch.status) && !isActive(existing?.status ?? 'none')
        if (activating && planId) {
            await this.createInvoice({ userId, planId, status: 'open' }).catch((error) =>
                log.error('invoice creation failed', error)
            )
        }

        return toSubscription(saved)
    }

    async listInvoices(filters: InvoiceFilters): Promise<{ invoices: Invoice[]; total: number }> {
        const query = {
            userId: filters.userId ?? null,
            planId: filters.planId ?? null,
            status: filters.status ?? null,
            provider: filters.provider ?? null,
            from: parseDate(filters.from),
            to: parseDate(filters.to),
            q: filters.q?.trim() || null,
            limit: Math.min(filters.limit ?? 50, 200),
            offset: Math.max(filters.offset ?? 0, 0),
        }
        const [rows, total] = await Promise.all([
            this.billing.listInvoices(query),
            this.billing.countInvoices(query),
        ])
        return { invoices: rows.map(toInvoice), total }
    }

    async listInvoicesForUser(userId: string, filters: InvoiceFilters): Promise<{ invoices: Invoice[]; total: number }> {
        return this.listInvoices({ ...filters, userId })
    }

    async createInvoice(draft: InvoiceDraft): Promise<Invoice> {
        const user = await this.users.findById(draft.userId)
        if (!user) throw new NotFoundError('user_not_found', 'user not found', [draft.userId])

        const plan = draft.planId ? await this.billing.findPlan(draft.planId) : undefined
        if (draft.planId && !plan) {
            throw new NotFoundError('plan_not_found', 'plan not found', [draft.planId])
        }

        const issued = new Date()
        const status = draft.status ?? 'open'
        const created = await this.billing.insertInvoice({
            id: randomUUID(),
            number: draft.number?.trim() || invoiceNumber(issued),
            publicToken: randomUUID().replace(/-/g, ''),
            userId: draft.userId,
            planId: draft.planId ?? null,
            status,
            provider: (await this.managedProvider()) ?? 'manual',
            providerInvoiceId: '',
            amountCents: draft.amountCents ?? plan?.price_cents ?? 0,
            currency: draft.currency?.trim() || plan?.currency || 'USD',
            dueAt: parseDate(draft.dueAt),
            paidAt: status === 'paid' ? issued : null,
        })
        if (!created) throw new NotFoundError('not_found', 'invoice not found')
        return toInvoice(created)
    }

    async getPublicInvoice(token: string, workspace: string): Promise<PublicInvoice> {
        const row = await this.billing.findInvoiceByToken(token)
        if (!row) throw new NotFoundError('invoice_not_found', 'invoice not found')
        return {
            number: row.number,
            status: row.status,
            workspace,
            accountName: row.user_name,
            accountEmail: row.user_email,
            planName: row.plan_name,
            amountCents: row.amount_cents,
            currency: row.currency,
            issuedAt: row.issued_at.toISOString(),
            dueAt: row.due_at?.toISOString() ?? null,
            paidAt: row.paid_at?.toISOString() ?? null,
        }
    }

    async getOpenEnquiry(userId: string): Promise<SalesEnquiry | null> {
        const row = await this.billing.findOpenEnquiryForUser(userId)
        return row ? toSalesEnquiry(row) : null
    }

    async createEnquiry(userId: string, draft: SalesEnquiryDraft): Promise<SalesEnquiry> {
        const plan = await this.getPlan(draft.planId)

        const open = await this.billing.findOpenEnquiryForUser(userId)
        if (open) throw new ConflictError('enquiry_exists', 'an enquiry is already open', [open.id])
        const answers: Record<string, string> = {}
        for (const field of plan.salesFields) {
            const value = String(draft.answers?.[field.key] ?? '').trim()
            if (field.required && !value) {
                throw new ValidationError('answers_required', 'required answers missing', [field.label])
            }
            if (value) answers[field.key] = value.slice(0, 2000)
        }

        const result = await this.billing.insertEnquiry({
            id: randomUUID(),
            planId: plan.id,
            userId,
            status: 'new',
            answers,
        })
        if (result.isErr()) throw new ConflictError('enquiry_exists', 'an enquiry is already open')

        const created = result.unwrap()
        if (!created) throw new NotFoundError('enquiry_not_found', 'enquiry not found')

        await this.billing.insertEnquiryEvent({
            id: randomUUID(),
            enquiryId: created.id,
            actorId: userId,
            actorName: created.user_name || created.user_email,
            kind: 'created',
            status: 'new',
            note: '',
            invoiceId: null,
        })

        return toSalesEnquiry(created)
    }

    async listEnquiries(filters: EnquiryFilters): Promise<{ enquiries: SalesEnquiry[]; total: number }> {
        const query = {
            status: filters.status ?? null,
            planId: filters.planId ?? null,
            q: filters.q?.trim() || null,
            limit: Math.min(filters.limit ?? 50, 200),
            offset: Math.max(filters.offset ?? 0, 0),
        }
        const [rows, total] = await Promise.all([
            this.billing.listEnquiries(query),
            this.billing.countEnquiries(query),
        ])
        return { enquiries: rows.map(toSalesEnquiry), total }
    }

    async publicConstants(): Promise<PublicConstants> {
        const features = await this.features.getFlags()
        return {
            workspace: WORKSPACE_NAME,
            features,
            plans: features.billing ? await this.listPlans() : [],
        }
    }

    async listEnquiryEvents(enquiryId: string): Promise<SalesEnquiryEvent[]> {
        const enquiry = await this.billing.findEnquiry(enquiryId)
        if (!enquiry) throw new NotFoundError('enquiry_not_found', 'enquiry not found', [enquiryId])
        return (await this.billing.listEnquiryEvents(enquiryId)).map(toSalesEnquiryEvent)
    }

    async applyEnquiryAction(
        actor: User,
        enquiryId: string,
        draft: EnquiryActionDraft
    ): Promise<EnquiryActionResult> {
        const existing = await this.billing.findEnquiry(enquiryId)
        if (!existing) throw new NotFoundError('enquiry_not_found', 'enquiry not found', [enquiryId])

        const note = draft.note?.trim() ?? ''
        let invoice: Invoice | null = null
        let status: EnquiryStatus | null = null

        if (draft.kind === 'invoice') {
            invoice = await this.createInvoice({
                userId: existing.user_id,
                planId: existing.plan_id,
                amountCents: draft.amountCents,
                currency: draft.currency,
                status: 'open',
            })
        }

        if (draft.kind === 'status') {
            if (!draft.status) throw new ValidationError('invalid_input', 'a status is required')
            status = draft.status
        }

        if (draft.kind === 'note' && !note) {
            throw new ValidationError('invalid_input', 'a note is required')
        }

        const eventId = randomUUID()
        await this.billing.insertEnquiryEvent({
            id: eventId,
            enquiryId,
            actorId: actor.id,
            actorName: actor.name || actor.email,
            kind: draft.kind,
            status,
            note,
            invoiceId: invoice?.id ?? null,
        })

        const saved = status
            ? await this.setEnquiryStatus(enquiryId, status)
            : toSalesEnquiry(existing)

        const events = await this.billing.listEnquiryEvents(enquiryId)
        const event = events.find((entry) => entry.id === eventId)
        if (!event) throw new NotFoundError('enquiry_not_found', 'enquiry event not found')

        return { enquiry: saved, event: toSalesEnquiryEvent(event), invoice }
    }

    async setEnquiryStatus(id: string, status: EnquiryStatus): Promise<SalesEnquiry> {
        const updated = await this.billing.updateEnquiryStatus(id, status)
        if (!updated) throw new NotFoundError('enquiry_not_found', 'enquiry not found', [id])
        return toSalesEnquiry(updated)
    }

    async setInvoiceStatus(id: string, status: InvoiceStatus): Promise<Invoice> {
        const updated = await this.billing.updateInvoiceStatus(id, status)
        if (!updated) throw new NotFoundError('not_found', 'invoice not found', [id])
        return toInvoice(updated)
    }

    async expireDue(): Promise<number> {
        const due = await this.billing.listExpired()
        for (const row of due) {
            await this.applySubscription(row.user_id, { status: 'canceled' })
        }
        if (due.length > 0) log.info('expired subscriptions', { expired: due.length })
        return due.length
    }

    async resolvePlan(userId: string): Promise<Plan | null> {
        const row = await this.billing.findSubscription(userId)
        const planId = row?.staff_override_plan_id
            ?? (row && isActive(row.status) ? row.plan_id : null)
        if (planId) {
            const plan = await this.billing.findPlan(planId)
            if (plan) return toPlan(plan)
        }
        const bindings = await this.access.getBindings()
        const plans = await this.billing.listActivePlans()
        const fallback = plans.find((plan) => plan.role_id === bindings.default)
        return fallback ? toPlan(fallback) : null
    }

    async setPlanOverride(userId: string, planId: string | null): Promise<Subscription> {
        if (planId) {
            const plan = await this.billing.findPlan(planId)
            if (!plan) throw new NotFoundError('plan_not_found', `unknown plan ${planId}`, [planId])
        }
        await this.billing.setPlanOverride(userId, planId)
        const row = await this.billing.findSubscription(userId)
        if (row) await this.syncRole(userId, row)
        this.access.invalidateUser(userId)
        return row ? toSubscription(row) : NO_SUBSCRIPTION
    }

    async flagOverage(userId: string, bytes: number): Promise<void> {
        await this.billing.flagStorageOverage(userId, bytes)
    }

    private async syncRole(userId: string, row: SubscriptionRow): Promise<void> {
        const user = await this.users.findById(userId)
        if (!user || user.role === OWNER_ROLE_ID) return

        const plans = await this.billing.listActivePlans()
        const planRoles = new Set(plans.map((plan) => plan.role_id).filter((id): id is string => Boolean(id)))

        if (row.staff_override_plan_id) {
            const overrideRole = plans.find((plan) => plan.id === row.staff_override_plan_id)?.role_id ?? null
            if (overrideRole && user.role !== overrideRole) {
                await this.users.update(userId, { role: overrideRole })
                this.access.invalidateUser(userId)
            }
            return
        }

        const planRole = row.plan_id
            ? plans.find((plan) => plan.id === row.plan_id)?.role_id ?? null
            : null

        if (isActive(row.status) && planRole && user.role !== planRole) {
            await this.users.update(userId, { role: planRole })
            this.access.invalidateUser(userId)
            return
        }

        if (!isActive(row.status) && planRoles.has(user.role)) {
            const bindings = await this.access.getBindings()
            const fallback = bindings.default
            if (fallback && user.role !== fallback) {
                await this.users.update(userId, { role: fallback })
                this.access.invalidateUser(userId)
            }
        }
    }

    async listCoupons(): Promise<Coupon[]> {
        return (await this.billing.listCoupons()).map(toCoupon)
    }

    async createCoupon(draft: CouponDraft): Promise<Coupon> {
        const code = draft.code.trim().toUpperCase()
        if (!code) throw new ValidationError('coupon_code_required', 'a coupon code is required')
        if (!draft.percentOff && !draft.amountOff) {
            throw new ValidationError('coupon_value_required', 'set a percentage or a fixed amount')
        }

        const row = await this.billing.insertCoupon({
            id: randomUUID(),
            code,
            percentOff: draft.percentOff ?? null,
            amountOff: draft.amountOff ?? null,
            currency: draft.currency?.trim() || 'USD',
            durationMonths: draft.durationMonths ?? 1,
            maxRedemptions: draft.maxRedemptions ?? null,
            expiresAt: draft.expiresAt ? new Date(draft.expiresAt) : null,
            active: draft.active ?? true,
        })
        return toCoupon(row)
    }

    async deleteCoupon(id: string): Promise<void> {
        const removed = await this.billing.deleteCoupon(id)
        if (!removed) throw new NotFoundError('coupon_not_found', 'coupon not found', [id])
    }

    async previewCoupon(code: string, amountCents: number): Promise<{ coupon: Coupon; discountCents: number }> {
        const row = await this.billing.findCouponByCode(code.trim())
        if (!row) throw new NotFoundError('coupon_not_found', 'coupon not found', [code])

        return { coupon: toCoupon(row), discountCents: discountFor(row, amountCents) }
    }

    async redeemCoupon(userId: string, code: string, invoiceId: string | null): Promise<Coupon> {
        const row = await this.billing.findCouponByCode(code.trim())
        if (!row) throw new NotFoundError('coupon_not_found', 'coupon not found', [code])

        const redeemed = await this.billing.redeemCoupon({
            id: randomUUID(),
            couponId: row.id,
            userId,
            invoiceId,
        })
        if (!redeemed) throw new ConflictError('coupon_already_redeemed', 'coupon already redeemed', [code])
        return toCoupon(redeemed)
    }

    async recordUsage(userId: string, resource: string, quantity = 1): Promise<void> {
        await this.billing.insertUsageEvent({
            id: randomUUID(),
            userId,
            resource,
            quantity,
            occurredAt: null,
        })
    }

    async usage(userId: string, from?: string, to?: string): Promise<UsageSummary> {
        const start = from ? new Date(from) : startOfMonth()
        const end = to ? new Date(to) : new Date()

        const rows = await this.billing.usageSummary(userId, start, end)
        return {
            userId,
            from: start.toISOString(),
            to: end.toISOString(),
            totals: Object.fromEntries(rows.map((row) => [row.resource, Number(row.total)])),
        }
    }

    async prorationCredit(userId: string): Promise<number> {
        const row = await this.billing.findSubscription(userId)
        if (!row || !isActive(row.status) || !row.current_period_end || !row.plan_id) return 0

        const plan = await this.billing.findPlan(row.plan_id)
        if (!plan) return 0

        const periodMs = plan.interval === 'year' ? 365 * 24 * 3600 * 1000 : 30 * 24 * 3600 * 1000
        const remainingMs = row.current_period_end.getTime() - Date.now()
        if (remainingMs <= 0) return 0

        return Math.max(0, Math.round(plan.price_cents * Math.min(1, remainingMs / periodMs)))
    }

    async sendDunning(): Promise<number> {
        let sent = 0

        for (const stage of DUNNING_STAGES) {
            const due = await this.billing.dueInvoices(stage.afterDays, stage.stage)
            for (const invoice of due) {
                await this.email.queueDirect({
                    toEmail: invoice.user_email,
                    toName: invoice.user_name,
                    subject: `Invoice ${invoice.number} is overdue`,
                    body: [
                        `Invoice ${invoice.number} is still open.`,
                        '',
                        `View or print it: ${WEB_URL || ''}/invoice/${invoice.public_token}`,
                    ].join('\n'),
                })
                await this.billing.recordReminder(randomUUID(), invoice.id, stage.stage)
                sent += 1
            }
        }

        return sent
    }
}
