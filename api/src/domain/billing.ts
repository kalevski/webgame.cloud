import type { BillingProvider, CheckoutIntent, Plan, Subscription } from '../contracts/index.js'

export type CheckoutRequest = {
    userId: string
    userEmail: string
    plan: Plan

    successUrl: string
    cancelUrl: string

    salesContact: string
}

export type ProviderSubscription = {
    status: Subscription['status']
    providerCustomerId: string
    providerSubscriptionId: string
    currentPeriodEnd: Date | null
    cancelAtPeriodEnd: boolean
}

export type BillingPort = {
    id: BillingProvider

    startCheckout(request: CheckoutRequest): Promise<CheckoutIntent>

    cancel(subscription: ProviderSubscription): Promise<ProviderSubscription>

    resume(subscription: ProviderSubscription): Promise<ProviderSubscription>
}

const registry = new Map<BillingProvider, BillingPort>()

export const registerBillingPort = (port: BillingPort): void => {
    registry.set(port.id, port)
}

export const getBillingPort = (id: BillingProvider): BillingPort | undefined => registry.get(id)

export const manualBillingPort: BillingPort = {
    id: 'manual',

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
}

registerBillingPort(manualBillingPort)
