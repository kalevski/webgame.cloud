import type {
    Coupon,
    BillingInterval,
    BillingProvider,
    EnquiryEventKind,
    EnquiryStatus,
    Invoice,
    InvoiceStatus,
    Plan,
    PlanMode,
    SalesEnquiry,
    SalesEnquiryEvent,
    SalesField,
    Subscription,
    SubscriptionStatus,
} from '../contracts/index.js'

export type PlanRow = {
    id: string
    name: string
    description: string
    role_id: string | null
    mode: PlanMode
    price_cents: number
    currency: string
    interval: BillingInterval
    position: number
    active: boolean
    features: string[]
    sales_fields: SalesField[]
    trial_days: number
    storage_overage_allowed: boolean
    created_at: Date
}

export const toPlan = (row: PlanRow): Plan => ({
    id: row.id,
    name: row.name,
    description: row.description,
    roleId: row.role_id,
    mode: row.mode,
    priceCents: row.price_cents,
    currency: row.currency,
    interval: row.interval,
    position: row.position,
    active: row.active,
    features: Array.isArray(row.features) ? row.features : [],
    salesFields: Array.isArray(row.sales_fields) ? row.sales_fields : [],
    trialDays: row.trial_days ?? 0,
    storageOverageAllowed: row.storage_overage_allowed ?? false,
})

export type SubscriptionRow = {
    user_id: string
    plan_id: string | null
    status: SubscriptionStatus
    provider: BillingProvider
    provider_customer_id: string
    provider_subscription_id: string
    cancel_at_period_end: boolean
    current_period_end: Date | null
    started_at: Date | null
    staff_override_plan_id: string | null
    storage_overage_bytes: string | number
    storage_overage_flagged_at: Date | null
    updated_at: Date
}

export const toSubscription = (row: SubscriptionRow): Subscription => ({
    status: row.status,
    planId: row.plan_id,
    provider: row.provider,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    currentPeriodEnd: row.current_period_end?.toISOString() ?? null,
    startedAt: row.started_at?.toISOString() ?? null,
    updatedAt: row.updated_at.toISOString(),
    staffOverridePlanId: row.staff_override_plan_id ?? null,
    storageOverageBytes: Number(row.storage_overage_bytes ?? 0),
    storageOverageFlaggedAt: row.storage_overage_flagged_at?.toISOString() ?? null,
})

export type InvoiceRow = {
    id: string
    number: string
    public_token: string
    user_id: string
    plan_id: string | null
    status: InvoiceStatus
    provider: BillingProvider
    provider_invoice_id: string
    amount_cents: number
    discount_cents: number
    credit_cents: number
    currency: string
    issued_at: Date
    due_at: Date | null
    paid_at: Date | null
    user_email: string
    user_name: string
    plan_name: string | null
}

export const toInvoice = (row: InvoiceRow): Invoice => ({
    id: row.id,
    number: row.number,
    publicToken: row.public_token,
    userId: row.user_id,
    userEmail: row.user_email,
    userName: row.user_name,
    planId: row.plan_id,
    planName: row.plan_name,
    status: row.status,
    provider: row.provider,
    amountCents: row.amount_cents,
    discountCents: row.discount_cents ?? 0,
    creditCents: row.credit_cents ?? 0,
    currency: row.currency,
    issuedAt: row.issued_at.toISOString(),
    dueAt: row.due_at?.toISOString() ?? null,
    paidAt: row.paid_at?.toISOString() ?? null,
})

export type SalesEnquiryRow = {
    id: string
    plan_id: string | null
    user_id: string
    status: EnquiryStatus
    answers: Record<string, string>
    created_at: Date
    updated_at: Date
    user_email: string
    user_name: string
    plan_name: string | null
}

export const toSalesEnquiry = (row: SalesEnquiryRow): SalesEnquiry => ({
    id: row.id,
    planId: row.plan_id,
    planName: row.plan_name,
    userId: row.user_id,
    userEmail: row.user_email,
    userName: row.user_name,
    status: row.status,
    answers: row.answers ?? {},
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
})

export type SalesEnquiryEventRow = {
    id: string
    enquiry_id: string
    actor_id: string | null
    actor_name: string
    kind: EnquiryEventKind
    status: EnquiryStatus | null
    note: string
    invoice_id: string | null
    invoice_number: string | null
    created_at: Date
}

export const toSalesEnquiryEvent = (row: SalesEnquiryEventRow): SalesEnquiryEvent => ({
    id: row.id,
    kind: row.kind,
    actorName: row.actor_name,
    status: row.status,
    note: row.note,
    invoiceId: row.invoice_id,
    invoiceNumber: row.invoice_number,
    createdAt: row.created_at.toISOString(),
})

export type CouponRow = {
    id: string
    code: string
    percent_off: number | null
    amount_off: number | null
    currency: string
    duration_months: number
    max_redemptions: number | null
    redeemed: number
    expires_at: Date | null
    active: boolean
    created_at: Date
    updated_at: Date
}

export const toCoupon = (row: CouponRow): Coupon => ({
    id: row.id,
    code: row.code,
    percentOff: row.percent_off,
    amountOff: row.amount_off,
    currency: row.currency,
    durationMonths: row.duration_months,
    maxRedemptions: row.max_redemptions,
    redeemed: row.redeemed,
    expiresAt: row.expires_at?.toISOString() ?? null,
    active: row.active,
    createdAt: row.created_at.toISOString(),
})
