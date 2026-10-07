import type { FeatureFlags } from './features.js'

export type PublicConstants = {
    workspace: string

    features: FeatureFlags

    plans: Plan[]
}

export const SUBSCRIPTION_STATUSES = [
    'none',
    'trialing',
    'active',
    'past_due',
    'canceled',
] as const

export type SubscriptionStatus = typeof SUBSCRIPTION_STATUSES[number]

export const ACTIVE_SUBSCRIPTION_STATUSES: readonly SubscriptionStatus[] = ['trialing', 'active']

export const BILLING_PROVIDERS = [
    'manual',
] as const

export type BillingProvider = typeof BILLING_PROVIDERS[number]

export const BILLING_INTERVALS = [
    'month',
    'year',
] as const

export type BillingInterval = typeof BILLING_INTERVALS[number]

export const PLAN_MODES = [
    'manual',
    'managed',
] as const

export type PlanMode = typeof PLAN_MODES[number]

export const SALES_FIELD_TYPES = [
    'text',
    'textarea',
    'email',
    'number',
] as const

export type SalesFieldType = typeof SALES_FIELD_TYPES[number]

export type SalesField = {
    key: string
    label: string
    type: SalesFieldType

    required: boolean

    placeholder?: string
}

export type Plan = {
    id: string
    name: string
    description: string

    roleId: string | null

    visibleRoleIds: string[]

    mode: PlanMode

    priceCents: number
    currency: string
    interval: BillingInterval
    position: number

    active: boolean

    features: string[]

    salesFields: SalesField[]

    trialDays: number

    providerProductId: string

    storageOverageAllowed: boolean
}

export type PlanDraft = {
    id?: string
    name: string
    trialDays?: number
    description?: string
    roleId?: string | null
    visibleRoleIds?: string[]
    mode?: PlanMode
    priceCents?: number
    currency?: string
    interval?: BillingInterval
    position?: number
    active?: boolean
    features?: string[]
    salesFields?: SalesField[]
    providerProductId?: string
}

export const isPlanVisibleTo = (plan: Pick<Plan, 'visibleRoleIds'>, roleId: string | null): boolean =>
    plan.visibleRoleIds.length === 0 || (roleId !== null && plan.visibleRoleIds.includes(roleId))

export type Subscription = {
    status: SubscriptionStatus
    planId: string | null
    provider: BillingProvider

    cancelAtPeriodEnd: boolean

    currentPeriodEnd: string | null
    startedAt: string | null
    updatedAt: string | null

    staffOverridePlanId: string | null
    storageOverageBytes: number
    storageOverageFlaggedAt: string | null
}

export const NO_SUBSCRIPTION: Subscription = {
    status: 'none',
    planId: null,
    provider: 'manual',
    cancelAtPeriodEnd: false,
    currentPeriodEnd: null,
    startedAt: null,
    updatedAt: null,
    staffOverridePlanId: null,
    storageOverageBytes: 0,
    storageOverageFlaggedAt: null,
}

export const CHECKOUT_OUTCOMES = [
    'redirect',
    'activated',
    'contact_sales',
    'unavailable',
] as const

export type CheckoutOutcome = typeof CHECKOUT_OUTCOMES[number]

export type CheckoutIntent = {
    outcome: CheckoutOutcome
    provider: BillingProvider
    planId: string

    redirectUrl: string | null

    salesContact: string
}

export const INVOICE_STATUSES = [
    'draft',
    'open',
    'paid',
    'void',
    'uncollectible',
] as const

export type InvoiceStatus = typeof INVOICE_STATUSES[number]

export type Invoice = {
    id: string
    number: string

    publicToken: string

    userId: string
    userEmail: string
    userName: string

    planId: string | null
    planName: string | null

    status: InvoiceStatus
    provider: BillingProvider

    amountCents: number
    discountCents: number
    creditCents: number
    currency: string

    issuedAt: string
    dueAt: string | null
    paidAt: string | null
}

export const ENQUIRY_STATUSES = [
    'new',
    'contacted',
    'won',
    'lost',
] as const

export type Coupon = {
    id: string

    code: string

    percentOff: number | null
    amountOff: number | null
    currency: string

    durationMonths: number

    maxRedemptions: number | null
    redeemed: number

    expiresAt: string | null

    active: boolean

    createdAt: string
}

export type CouponDraft = {
    code: string
    percentOff?: number | null
    amountOff?: number | null
    currency?: string
    durationMonths?: number
    maxRedemptions?: number | null
    expiresAt?: string | null
    active?: boolean
}

export type UsageSummary = {
    userId: string

    from: string
    to: string

    totals: Record<string, number>
}

export type EnquiryStatus = typeof ENQUIRY_STATUSES[number]

export type SalesEnquiry = {
    id: string

    planId: string | null
    planName: string | null

    userId: string
    userEmail: string
    userName: string

    status: EnquiryStatus

    answers: Record<string, string>

    createdAt: string
    updatedAt: string
}

export type SalesEnquiryDraft = {
    planId: string
    answers: Record<string, string>
}

export const ENQUIRY_EVENT_KINDS = [
    'created',
    'status',
    'note',
    'invoice',
] as const

export type EnquiryEventKind = typeof ENQUIRY_EVENT_KINDS[number]

export type SalesEnquiryEvent = {
    id: string
    kind: EnquiryEventKind

    actorName: string

    status: EnquiryStatus | null
    note: string

    invoiceId: string | null
    invoiceNumber: string | null

    createdAt: string
}

export type EnquiryActionDraft = {
    kind: Exclude<EnquiryEventKind, 'created'>

    status?: EnquiryStatus
    note?: string

    amountCents?: number
    currency?: string
}

export type EnquiryActionResult = {
    enquiry: SalesEnquiry
    event: SalesEnquiryEvent

    invoice: Invoice | null
}

export type EnquiryFilters = {
    status?: EnquiryStatus
    planId?: string
    q?: string
    limit?: number
    offset?: number
}

export type PublicInvoice = {
    number: string
    status: InvoiceStatus

    workspace: string

    accountName: string
    accountEmail: string

    planName: string | null

    amountCents: number
    currency: string

    issuedAt: string
    dueAt: string | null
    paidAt: string | null
}

export type InvoiceDraft = {
    userId: string
    planId?: string | null
    amountCents?: number
    currency?: string
    status?: InvoiceStatus
    dueAt?: string | null
    number?: string
}

export type InvoiceFilters = {
    userId?: string
    planId?: string
    status?: InvoiceStatus
    provider?: BillingProvider

    from?: string
    to?: string

    q?: string

    limit?: number
    offset?: number
}

export type SubscriptionPatch = {
    status: SubscriptionStatus
    planId?: string | null

    currentPeriodEnd?: string | null
}

export type PortalLink = {
    url: string
}

export const BILLING_EVENT_STATUSES = [
    'received',
    'applied',
    'ignored',
    'failed',
] as const

export type BillingEventStatus = typeof BILLING_EVENT_STATUSES[number]

export type BillingEvent = {
    id: string
    provider: BillingProvider
    eventType: string

    userId: string | null
    userEmail: string | null
    userName: string | null

    providerSubscriptionId: string

    objectAt: string

    payload: unknown

    status: BillingEventStatus
    attempts: number
    error: string
    appliedAt: string | null

    createdAt: string
}

export type BillingEventFilters = {
    status?: BillingEventStatus
    eventType?: string
    userId?: string
    q?: string

    limit?: number
    offset?: number
}
