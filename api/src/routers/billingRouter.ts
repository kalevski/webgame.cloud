import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import type {
    AccountUsage,
    BillingEvent,
    BillingEventFilters,
    CheckoutIntent,
    Coupon,
    CouponDraft,
    UsageSummary,
    EnquiryActionDraft,
    EnquiryActionResult,
    EnquiryFilters,
    EnquiryStatus,
    PortalLink,
    PublicConstants,
    PublicInvoice,
    SalesEnquiry,
    SalesEnquiryEvent,
    SalesEnquiryDraft,
    Invoice,
    InvoiceFilters,
    InvoiceStatus,
    Plan,
    PlanDraft,
    Subscription,
    SubscriptionPatch,
} from '../contracts/index.js'
import {
    BILLING_EVENT_STATUSES,
    BILLING_INTERVALS,
    BILLING_PROVIDERS,
    ENQUIRY_EVENT_KINDS,
    ENQUIRY_STATUSES,
    INVOICE_STATUSES,
    PLAN_MODES,
    SALES_FIELD_TYPES,
    SUBSCRIPTION_STATUSES,
} from '../contracts/index.js'
import { BillingEventService } from '../services/BillingEventService.js'
import { requireAuth, requirePermission } from '../auth.js'
import { requireFeature } from '../features.js'
import { rateLimit } from '../http/rateLimit.js'
import { recordRequestAudit } from '../audit.js'
import container from '../container.js'
import { BillingService } from '../services/BillingService.js'
import { AccessPolicyService } from '../services/AccessPolicyService.js'
import { WORKSPACE_NAME } from '../env.js'

const billing = () => container.resolve(BillingService)
const billingEvents = () => container.resolve(BillingEventService)

const checkoutSchema = {
    type: 'object',
    required: ['planId'],
    additionalProperties: false,
    properties: {
        planId: { type: 'string', minLength: 1, maxLength: 60 },
    },
} as const

const subscriptionPatchSchema = {
    type: 'object',
    required: ['status'],
    additionalProperties: false,
    properties: {
        status: { type: 'string', enum: [...SUBSCRIPTION_STATUSES] },
        planId: { type: ['string', 'null'], maxLength: 60 },
        currentPeriodEnd: { type: ['string', 'null'], maxLength: 40 },
    },
} as const

const planSchema = {
    type: 'object',
    required: ['name'],
    additionalProperties: false,
    properties: {
        id: { type: 'string', maxLength: 60 },
        name: { type: 'string', minLength: 1, maxLength: 120 },
        description: { type: 'string', maxLength: 600 },
        roleId: { type: ['string', 'null'], maxLength: 60 },
        visibleRoleIds: { type: 'array', maxItems: 50, items: { type: 'string', minLength: 1, maxLength: 60 } },
        mode: { type: 'string', enum: [...PLAN_MODES] },
        priceCents: { type: 'integer', minimum: 0, maximum: 100_000_000 },
        currency: { type: 'string', minLength: 3, maxLength: 3 },
        interval: { type: 'string', enum: [...BILLING_INTERVALS] },
        position: { type: 'integer', minimum: 0, maximum: 10_000 },
        active: { type: 'boolean' },
        trialDays: { type: 'integer', minimum: 0, maximum: 365 },
        providerProductId: { type: 'string', maxLength: 120 },
        features: { type: 'array', maxItems: 20, items: { type: 'string', maxLength: 120 } },
        salesFields: {
            type: 'array',
            maxItems: 12,
            items: {
                type: 'object',
                required: ['key', 'label', 'type'],
                additionalProperties: false,
                properties: {
                    key: { type: 'string', minLength: 1, maxLength: 40 },
                    label: { type: 'string', minLength: 1, maxLength: 120 },
                    type: { type: 'string', enum: [...SALES_FIELD_TYPES] },
                    required: { type: 'boolean' },
                    placeholder: { type: 'string', maxLength: 120 },
                },
            },
        },
    },
} as const

const couponSchema = {
    type: 'object',
    required: ['code'],
    additionalProperties: false,
    properties: {
        code: { type: 'string', minLength: 1, maxLength: 40 },
        percentOff: { type: ['integer', 'null'], minimum: 1, maximum: 100 },
        amountOff: { type: ['integer', 'null'], minimum: 1, maximum: 100000000 },
        currency: { type: 'string', minLength: 3, maxLength: 3 },
        durationMonths: { type: 'integer', minimum: 0, maximum: 120 },
        maxRedemptions: { type: ['integer', 'null'], minimum: 1, maximum: 1000000 },
        expiresAt: { type: ['string', 'null'], maxLength: 40 },
        active: { type: 'boolean' },
    },
} as const

const couponPreviewSchema = {
    type: 'object',
    required: ['code'],
    additionalProperties: false,
    properties: {
        code: { type: 'string', minLength: 1, maxLength: 40 },
        amountCents: { type: 'integer', minimum: 0, maximum: 100000000 },
    },
} as const

const enquiryCreateSchema = {
    type: 'object',
    required: ['planId', 'answers'],
    additionalProperties: false,
    properties: {
        planId: { type: 'string', minLength: 1, maxLength: 60 },
        answers: { type: 'object', additionalProperties: { type: 'string', maxLength: 2000 } },
    },
} as const

const enquiryQuerySchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        status: { type: 'string', enum: [...ENQUIRY_STATUSES] },
        planId: { type: 'string', maxLength: 60 },
        q: { type: 'string', maxLength: 200 },
        limit: { type: 'integer', minimum: 1, maximum: 200 },
        offset: { type: 'integer', minimum: 0 },
    },
} as const

const enquiryActionSchema = {
    type: 'object',
    required: ['kind'],
    additionalProperties: false,
    properties: {
        kind: { type: 'string', enum: ENQUIRY_EVENT_KINDS.filter((kind) => kind !== 'created') },
        status: { type: 'string', enum: [...ENQUIRY_STATUSES] },
        note: { type: 'string', maxLength: 2000 },
        amountCents: { type: 'integer', minimum: 0, maximum: 100_000_000 },
        currency: { type: 'string', minLength: 3, maxLength: 3 },
    },
} as const

const enquiryStatusSchema = {
    type: 'object',
    required: ['status'],
    additionalProperties: false,
    properties: {
        status: { type: 'string', enum: [...ENQUIRY_STATUSES] },
    },
} as const

const invoiceQuerySchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        userId: { type: 'string', maxLength: 60 },
        planId: { type: 'string', maxLength: 60 },
        status: { type: 'string', enum: [...INVOICE_STATUSES] },
        provider: { type: 'string', enum: [...BILLING_PROVIDERS] },
        from: { type: 'string', maxLength: 40 },
        to: { type: 'string', maxLength: 40 },
        q: { type: 'string', maxLength: 200 },
        limit: { type: 'integer', minimum: 1, maximum: 200 },
        offset: { type: 'integer', minimum: 0 },
    },
} as const

const invoiceCreateSchema = {
    type: 'object',
    required: ['userId'],
    additionalProperties: false,
    properties: {
        userId: { type: 'string', minLength: 1, maxLength: 60 },
        planId: { type: ['string', 'null'], maxLength: 60 },
        amountCents: { type: 'integer', minimum: 0, maximum: 100_000_000 },
        currency: { type: 'string', minLength: 3, maxLength: 3 },
        status: { type: 'string', enum: [...INVOICE_STATUSES] },
        dueAt: { type: ['string', 'null'], maxLength: 40 },
        number: { type: 'string', maxLength: 60 },
    },
} as const

const invoiceStatusSchema = {
    type: 'object',
    required: ['status'],
    additionalProperties: false,
    properties: {
        status: { type: 'string', enum: [...INVOICE_STATUSES] },
    },
} as const

const changePlanSchema = {
    type: 'object',
    required: ['planId'],
    additionalProperties: false,
    properties: {
        planId: { type: 'string', minLength: 1, maxLength: 60 },
    },
} as const

const billingEventQuerySchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        status: { type: 'string', enum: [...BILLING_EVENT_STATUSES] },
        eventType: { type: 'string', maxLength: 120 },
        userId: { type: 'string', maxLength: 60 },
        q: { type: 'string', maxLength: 200 },
        limit: { type: 'integer', minimum: 1, maximum: 200 },
        offset: { type: 'integer', minimum: 0 },
    },
} as const

const listPlansEndpoint = async (request: FastifyRequest): Promise<Plan[]> =>
    billing().listPlans(request.user!)

const listAllPlansEndpoint = async (): Promise<Plan[]> => billing().listAllPlans()

const createPlanEndpoint = async (
    request: FastifyRequest<{ Body: PlanDraft }>,
    reply: FastifyReply
): Promise<Plan> => {
    const created = await billing().createPlan(request.body)
    void recordRequestAudit(request, 'create_plan', created.id, `${created.name} mode=${created.mode}`)
    reply.code(201)
    return created
}

const updatePlanEndpoint = async (
    request: FastifyRequest<{ Params: { planId: string }; Body: Partial<PlanDraft> }>,
    reply: FastifyReply
): Promise<Plan> => {
    const saved = await billing().updatePlan(request.params.planId, request.body)
    void recordRequestAudit(request, 'update_plan', saved.id, `${saved.name} mode=${saved.mode} role=${saved.roleId ?? 'none'}`)
    return saved
}

const deletePlanEndpoint = async (
    request: FastifyRequest<{ Params: { planId: string } }>,
    reply: FastifyReply
) => {
    await billing().deletePlan(request.params.planId)
    void recordRequestAudit(request, 'delete_plan', request.params.planId)
    reply.code(204)
    return null
}

const listInvoicesEndpoint = async (
    request: FastifyRequest<{ Querystring: InvoiceFilters }>
): Promise<{ invoices: Invoice[]; total: number }> => billing().listInvoices(request.query)

const createInvoiceEndpoint = async (
    request: FastifyRequest<{ Body: { userId: string } }>,
    reply: FastifyReply
): Promise<Invoice> => {
    const created = await billing().createInvoice(request.body)
    void recordRequestAudit(request, 'create_invoice', created.id, `${created.number} ${created.amountCents}`)
    reply.code(201)
    return created
}

const patchInvoiceEndpoint = async (
    request: FastifyRequest<{ Params: { invoiceId: string }; Body: { status: InvoiceStatus } }>,
    reply: FastifyReply
): Promise<Invoice> => {
    const saved = await billing().setInvoiceStatus(request.params.invoiceId, request.body.status)
    void recordRequestAudit(request, 'update_invoice', saved.id, `${saved.number} status=${saved.status}`)
    return saved
}

const createEnquiryEndpoint = async (
    request: FastifyRequest<{ Body: SalesEnquiryDraft }>,
    reply: FastifyReply
): Promise<SalesEnquiry> => {
    const created = await billing().createEnquiry(request.user!.id, request.body)
    void recordRequestAudit(request, 'submit_enquiry', created.id, created.planName ?? request.body.planId)
    reply.code(201)
    return created
}

const listEnquiriesEndpoint = async (
    request: FastifyRequest<{ Querystring: EnquiryFilters }>
): Promise<{ enquiries: SalesEnquiry[]; total: number }> => billing().listEnquiries(request.query)

const patchEnquiryEndpoint = async (
    request: FastifyRequest<{ Params: { enquiryId: string }; Body: { status: EnquiryStatus } }>,
    reply: FastifyReply
): Promise<SalesEnquiry> => {
    const saved = await billing().setEnquiryStatus(request.params.enquiryId, request.body.status)
    void recordRequestAudit(request, 'update_sales_enquiry', saved.id, `status=${saved.status}`)
    return saved
}

const publicConstantsEndpoint = async (request: FastifyRequest): Promise<PublicConstants> =>
    billing().publicConstants(request.user ?? null)

const enquiryEventsEndpoint = async (
    request: FastifyRequest<{ Params: { enquiryId: string } }>,
    reply: FastifyReply
): Promise<SalesEnquiryEvent[]> => {
    return await billing().listEnquiryEvents(request.params.enquiryId)
}

const enquiryActionEndpoint = async (
    request: FastifyRequest<{ Params: { enquiryId: string }; Body: EnquiryActionDraft }>,
    reply: FastifyReply
): Promise<EnquiryActionResult> => {
    const result = await billing().applyEnquiryAction(request.user!, request.params.enquiryId, request.body)
    void recordRequestAudit(
        request,
        'sales_enquiry_action',
        request.params.enquiryId,
        `${request.body.kind}${result.enquiry.status ? ` status=${result.enquiry.status}` : ''}${result.invoice ? ` invoice=${result.invoice.number}` : ''}`
    )
    reply.code(201)
    return result
}

const publicInvoiceEndpoint = async (
    request: FastifyRequest<{ Params: { token: string } }>,
    reply: FastifyReply
): Promise<PublicInvoice> => {
    return await billing().getPublicInvoice(request.params.token, WORKSPACE_NAME)
}

const mySubscriptionEndpoint = async (request: FastifyRequest): Promise<Subscription> =>
    billing().getSubscription(request.user!.id)

const myEnquiryEndpoint = async (request: FastifyRequest): Promise<{ enquiry: SalesEnquiry | null }> => ({
    enquiry: await billing().getOpenEnquiry(request.user!.id),
})

const myInvoicesEndpoint = async (
    request: FastifyRequest<{ Querystring: InvoiceFilters }>
): Promise<{ invoices: Invoice[]; total: number }> =>
    billing().listInvoicesForUser(request.user!.id, { ...request.query, userId: undefined })

const checkoutEndpoint = async (
    request: FastifyRequest<{ Body: { planId: string } }>,
    reply: FastifyReply
): Promise<CheckoutIntent> => {
    const intent = await billing().startCheckout(request.user!, request.body.planId)
    void recordRequestAudit(request, 'start_checkout', request.body.planId, intent.outcome)
    return intent
}

const cancelEndpoint = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<Subscription> => {
    const canceled = await billing().cancel(request.user!)
    void recordRequestAudit(request, 'cancel_subscription', request.user!.id, canceled.planId ?? '')
    return canceled
}

const resumeEndpoint = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<Subscription> => {
    const resumed = await billing().resume(request.user!)
    void recordRequestAudit(request, 'resume_subscription', request.user!.id, resumed.planId ?? '')
    return resumed
}

const changePlanEndpoint = async (
    request: FastifyRequest<{ Body: { planId: string } }>,
    reply: FastifyReply
): Promise<Subscription> => {
    const changed = await billing().changePlan(request.user!, request.body.planId)
    void recordRequestAudit(request, 'change_plan', request.user!.id, request.body.planId)
    return changed
}

const portalEndpoint = async (request: FastifyRequest): Promise<PortalLink> =>
    billing().portalUrl(request.user!)

const listBillingEventsEndpoint = async (
    request: FastifyRequest<{ Querystring: BillingEventFilters }>
): Promise<{ events: BillingEvent[]; total: number }> => billingEvents().list(request.query)

const replayBillingEventEndpoint = async (
    request: FastifyRequest<{ Params: { eventId: string } }>,
    reply: FastifyReply
): Promise<BillingEvent> => {
    const replayed = await billingEvents().replay(request.params.eventId)
    void recordRequestAudit(request, 'billing_event_replayed', replayed.id, replayed.eventType)
    return replayed
}

const userSubscriptionEndpoint = async (
    request: FastifyRequest<{ Params: { userId: string } }>
): Promise<Subscription> => billing().getSubscription(request.params.userId)

const patchUserSubscriptionEndpoint = async (
    request: FastifyRequest<{ Params: { userId: string }; Body: SubscriptionPatch }>,
    reply: FastifyReply
): Promise<Subscription> => {
    const saved = await billing().applySubscription(request.params.userId, request.body)
    void recordRequestAudit(
        request,
        'update_subscription',
        request.params.userId,
        `status=${saved.status} plan=${saved.planId ?? 'none'}`
    )
    return saved
}

export const publicBillingRouter: FastifyPluginAsync = async (app) => {
    app.get('/api/public/constants', publicConstantsEndpoint)

    app.get<{ Params: { token: string } }>(
        '/api/billing/public/invoices/:token',
        { preHandler: [requireFeature('billing')] },
        publicInvoiceEndpoint
    )
}

const listCouponsEndpoint = async (): Promise<Coupon[]> => billing().listCoupons()

const createCouponEndpoint = async (
    request: FastifyRequest<{ Body: CouponDraft }>,
    reply: FastifyReply
): Promise<Coupon> => {
    const created = await billing().createCoupon(request.body)
    void recordRequestAudit(request, 'create_coupon', created.id, created.code)
    reply.code(201)
    return created
}

const deleteCouponEndpoint = async (
    request: FastifyRequest<{ Params: { couponId: string } }>,
    reply: FastifyReply
): Promise<null> => {
    await billing().deleteCoupon(request.params.couponId)
    void recordRequestAudit(request, 'delete_coupon', request.params.couponId, '')
    reply.code(204)
    return null
}

const previewCouponEndpoint = async (
    request: FastifyRequest<{ Querystring: { code: string; amountCents?: number } }>,
    reply: FastifyReply
): Promise<{ coupon: Coupon; discountCents: number }> => {
    return await billing().previewCoupon(request.query.code, request.query.amountCents ?? 0)
}

const myUsageEndpoint = async (
    request: FastifyRequest<{ Querystring: { from?: string; to?: string } }>
): Promise<UsageSummary> =>
    billing().usage(request.user!.id, request.query.from, request.query.to)

const planOverrideSchema = {
    type: 'object',
    required: ['planId'],
    additionalProperties: false,
    properties: { planId: { type: ['string', 'null'], maxLength: 80 } },
} as const

const accountUsageEndpoint = async (request: FastifyRequest): Promise<AccountUsage> => {
    const policy = container.resolve(AccessPolicyService)
    const [usage, storage] = await Promise.all([
        policy.usageFor(request.user!),
        policy.storageStatus(request.user!.id),
    ])
    void policy.syncOverageFlag(request.user!.id, storage)
    return { usage, storage }
}

const planOverrideEndpoint = async (
    request: FastifyRequest<{ Params: { id: string }; Body: { planId: string | null } }>,
    reply: FastifyReply
) => {
    const saved = await billing().setPlanOverride(request.params.id, request.body.planId)
    void recordRequestAudit(request, 'billing.plan_override', request.params.id, request.body.planId ?? '')
    return saved
}

const userUsageEndpoint = async (
    request: FastifyRequest<{ Params: { userId: string }; Querystring: { from?: string; to?: string } }>
): Promise<UsageSummary> =>
    billing().usage(request.params.userId, request.query.from, request.query.to)

export const billingRouter: FastifyPluginAsync = async (app) => {
    app.addHook('preHandler', requireFeature('billing'))
    app.addHook('preHandler', requireAuth)

    app.get('/api/billing/plans', listPlansEndpoint)

    app.get('/api/billing/subscription', mySubscriptionEndpoint)

    app.get('/api/billing/my/enquiry', myEnquiryEndpoint)

    app.get<{ Querystring: { from?: string; to?: string } }>('/api/billing/my/usage', myUsageEndpoint)

    app.get('/api/account/usage', accountUsageEndpoint)

    app.put<{ Params: { id: string }; Body: { planId: string | null } }>(
        '/api/admin/users/:id/plan-override',
        {
            schema: { body: planOverrideSchema },
            preHandler: [requirePermission('billing.subscription.write')],
        },
        planOverrideEndpoint
    )

    app.get<{ Querystring: { code: string; amountCents?: number } }>(
        '/api/billing/coupons/preview',
        { schema: { querystring: couponPreviewSchema } },
        previewCouponEndpoint
    )

    app.get(
        '/api/billing/coupons',
        { preHandler: [requirePermission('billing.plan.read')] },
        listCouponsEndpoint
    )

    app.post<{ Body: CouponDraft }>(
        '/api/billing/coupons',
        { schema: { body: couponSchema }, preHandler: [requirePermission('billing.plan.write')] },
        createCouponEndpoint
    )

    app.delete<{ Params: { couponId: string } }>(
        '/api/billing/coupons/:couponId',
        { preHandler: [requirePermission('billing.plan.write')] },
        deleteCouponEndpoint
    )

    app.get<{ Params: { userId: string }; Querystring: { from?: string; to?: string } }>(
        '/api/billing/usage/:userId',
        { preHandler: [requirePermission('billing.subscription.read')] },
        userUsageEndpoint
    )

    app.get<{ Querystring: InvoiceFilters }>(
        '/api/billing/my/invoices',
        { schema: { querystring: invoiceQuerySchema } },
        myInvoicesEndpoint
    )

    app.post<{ Body: { planId: string } }>(
        '/api/billing/checkout',
        { schema: { body: checkoutSchema } },
        checkoutEndpoint
    )

    app.post('/api/billing/cancel', cancelEndpoint)

    app.post('/api/billing/resume', resumeEndpoint)

    app.post<{ Body: { planId: string } }>(
        '/api/billing/change-plan',
        { schema: { body: changePlanSchema } },
        changePlanEndpoint
    )

    app.post('/api/billing/portal', portalEndpoint)

    app.get<{ Querystring: BillingEventFilters }>(
        '/api/billing/admin/events',
        { schema: { querystring: billingEventQuerySchema }, preHandler: [requirePermission('billing.subscription.read')] },
        listBillingEventsEndpoint
    )

    app.post<{ Params: { eventId: string } }>(
        '/api/billing/admin/events/:eventId/replay',
        { preHandler: [requirePermission('billing.subscription.write')] },
        replayBillingEventEndpoint
    )

    app.post<{ Body: SalesEnquiryDraft }>(
        '/api/billing/enquiries',
        {
            schema: { body: enquiryCreateSchema },
            preHandler: [rateLimit({ name: 'enquiry_create', max: 5, windowSeconds: 3600 })],
        },
        createEnquiryEndpoint
    )

    app.get<{ Querystring: EnquiryFilters }>(
        '/api/billing/admin/enquiries',
        { schema: { querystring: enquiryQuerySchema }, preHandler: [requirePermission('enquiry.read')] },
        listEnquiriesEndpoint
    )

    app.get<{ Params: { enquiryId: string } }>(
        '/api/billing/enquiries/:enquiryId/events',
        { preHandler: [requirePermission('enquiry.read')] },
        enquiryEventsEndpoint
    )

    app.post<{ Params: { enquiryId: string }; Body: EnquiryActionDraft }>(
        '/api/billing/enquiries/:enquiryId/actions',
        { schema: { body: enquiryActionSchema }, preHandler: [requirePermission('enquiry.write')] },
        enquiryActionEndpoint
    )

    app.patch<{ Params: { enquiryId: string }; Body: { status: EnquiryStatus } }>(
        '/api/billing/enquiries/:enquiryId',
        { schema: { body: enquiryStatusSchema }, preHandler: [requirePermission('enquiry.write')] },
        patchEnquiryEndpoint
    )

    app.get(
        '/api/billing/admin/plans',
        { preHandler: [requirePermission('billing.plan.read')] },
        listAllPlansEndpoint
    )

    app.post<{ Body: PlanDraft }>(
        '/api/billing/plans',
        { schema: { body: planSchema }, preHandler: [requirePermission('billing.plan.write')] },
        createPlanEndpoint
    )

    app.patch<{ Params: { planId: string }; Body: Partial<PlanDraft> }>(
        '/api/billing/plans/:planId',
        { schema: { body: { ...planSchema, required: [] } }, preHandler: [requirePermission('billing.plan.write')] },
        updatePlanEndpoint
    )

    app.delete<{ Params: { planId: string } }>(
        '/api/billing/plans/:planId',
        { preHandler: [requirePermission('billing.plan.write')] },
        deletePlanEndpoint
    )

    app.get<{ Querystring: InvoiceFilters }>(
        '/api/billing/invoices',
        { schema: { querystring: invoiceQuerySchema }, preHandler: [requirePermission('invoice.read')] },
        listInvoicesEndpoint
    )

    app.post<{ Body: { userId: string } }>(
        '/api/billing/invoices',
        { schema: { body: invoiceCreateSchema }, preHandler: [requirePermission('invoice.write')] },
        createInvoiceEndpoint
    )

    app.patch<{ Params: { invoiceId: string }; Body: { status: InvoiceStatus } }>(
        '/api/billing/invoices/:invoiceId',
        { schema: { body: invoiceStatusSchema }, preHandler: [requirePermission('invoice.write')] },
        patchInvoiceEndpoint
    )

    app.get<{ Params: { userId: string } }>(
        '/api/billing/subscriptions/:userId',
        { preHandler: [requirePermission('billing.subscription.read')] },
        userSubscriptionEndpoint
    )

    app.patch<{ Params: { userId: string }; Body: SubscriptionPatch }>(
        '/api/billing/subscriptions/:userId',
        { schema: { body: subscriptionPatchSchema }, preHandler: [requirePermission('billing.subscription.write')] },
        patchUserSubscriptionEndpoint
    )
}
