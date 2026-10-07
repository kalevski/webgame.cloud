import type { BillingProvider, CheckoutIntent, InvoiceStatus, Plan, Subscription, SubscriptionStatus } from '../contracts/index.js'

export type CheckoutRequest = {
    userId: string
    userEmail: string
    plan: Plan

    successUrl: string
    cancelUrl: string

    salesContact: string

    metadata: Record<string, string>
}

export type ProviderSubscription = {
    status: Subscription['status']
    providerCustomerId: string
    providerSubscriptionId: string
    currentPeriodEnd: Date | null
    cancelAtPeriodEnd: boolean
}

export type ProviderSnapshot = ProviderSubscription & {
    providerProductId: string
    objectAt: Date
}

export type ParsedBillingEventSubscription = {
    status: SubscriptionStatus
    providerCustomerId: string
    providerProductId: string | null
    cancelAtPeriodEnd: boolean
    currentPeriodEnd: Date | null
}

export type ParsedBillingEventInvoice = {
    providerInvoiceId: string
    amountCents: number
    currency: string
    status: Extract<InvoiceStatus, 'paid' | 'void' | 'uncollectible'>
}

export type ParsedBillingEvent = {
    id: string
    type: string
    objectAt: Date

    userId: string | null
    subscriptionId: string | null

    subscription: ParsedBillingEventSubscription | null
    invoice: ParsedBillingEventInvoice | null

    ignoredReason: string | null
}

export type BillingPort = {
    id: BillingProvider

    ready(): boolean

    startCheckout(request: CheckoutRequest): Promise<CheckoutIntent>

    cancel(subscription: ProviderSubscription): Promise<ProviderSubscription>

    resume(subscription: ProviderSubscription): Promise<ProviderSubscription>

    changePlan(subscription: ProviderSubscription, providerProductId: string): Promise<ProviderSubscription>

    portalUrl(providerCustomerId: string): Promise<string>

    fetchSubscription(providerSubscriptionId: string): Promise<ProviderSnapshot | null>

    verifyWebhookSignature(raw: Buffer, headers: Record<string, string | string[] | undefined>): boolean

    parseWebhookPayload(payload: unknown): ParsedBillingEvent
}

const registry = new Map<BillingProvider, BillingPort>()

export const registerBillingPort = (port: BillingPort): void => {
    registry.set(port.id, port)
}

export const getBillingPort = (id: BillingProvider): BillingPort | undefined => registry.get(id)

export const manualBillingPort: BillingPort = {
    id: 'manual',

    ready: () => true,

    async startCheckout(request: CheckoutRequest): Promise<CheckoutIntent> {
        return {
            outcome: 'contact_sales',
            provider: 'manual',
            planId: request.plan.id,
            redirectUrl: null,
            salesContact: request.salesContact,
        }
    },

    async cancel(subscription: ProviderSubscription): Promise<ProviderSubscription> {
        return { ...subscription, status: 'canceled', cancelAtPeriodEnd: false, currentPeriodEnd: null }
    },

    async resume(subscription: ProviderSubscription): Promise<ProviderSubscription> {
        return { ...subscription, cancelAtPeriodEnd: false }
    },

    async changePlan(subscription: ProviderSubscription): Promise<ProviderSubscription> {
        return subscription
    },

    async portalUrl(): Promise<string> {
        throw new Error('manual subscriptions have no billing portal')
    },

    async fetchSubscription(): Promise<ProviderSnapshot | null> {
        return null
    },

    verifyWebhookSignature(): boolean {
        return false
    },

    parseWebhookPayload(): ParsedBillingEvent {
        throw new Error('manual billing never receives webhooks')
    },
}

registerBillingPort(manualBillingPort)
