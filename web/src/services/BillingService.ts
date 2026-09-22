import { apiFetch } from 'helpers/api'
import { queryString } from 'helpers/query'
import {
    AccountUsage,
    CheckoutIntent,
    EnquiryActionDraft,
    EnquiryActionResult,
    EnquiryFilters,
    EnquiryStatus,
    FeatureFlags,
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
} from 'types'

class BillingService {
    private static instance: BillingService
    private constructor() {}

    static getInstance(): BillingService {
        if (!BillingService.instance) BillingService.instance = new BillingService()
        return BillingService.instance
    }

    async listPlans(): Promise<Plan[]> {
        return apiFetch<Plan[]>('/api/billing/plans')
    }

    async fetchSubscription(): Promise<Subscription> {
        return apiFetch<Subscription>('/api/billing/subscription')
    }

    async startCheckout(planId: string): Promise<CheckoutIntent> {
        return apiFetch<CheckoutIntent>('/api/billing/checkout', {
            method: 'POST',
            body: JSON.stringify({ planId }),
        })
    }

    async accountUsage(): Promise<AccountUsage> {
        return apiFetch<AccountUsage>('/api/account/usage')
    }

    async cancel(): Promise<Subscription> {
        return apiFetch<Subscription>('/api/billing/cancel', { method: 'POST' })
    }

    async updateUserSubscription(userId: string, patch: SubscriptionPatch): Promise<Subscription> {
        return apiFetch<Subscription>(`/api/billing/subscriptions/${encodeURIComponent(userId)}`, {
            method: 'PATCH',
            body: JSON.stringify(patch),
        })
    }

    async listAllPlans(): Promise<Plan[]> {
        return apiFetch<Plan[]>('/api/billing/admin/plans')
    }

    async createPlan(draft: PlanDraft): Promise<Plan> {
        return apiFetch<Plan>('/api/billing/plans', { method: 'POST', body: JSON.stringify(draft) })
    }

    async updatePlan(planId: string, patch: Partial<PlanDraft>): Promise<Plan> {
        return apiFetch<Plan>(`/api/billing/plans/${encodeURIComponent(planId)}`, {
            method: 'PATCH',
            body: JSON.stringify(patch),
        })
    }

    async deletePlan(planId: string): Promise<void> {
        await apiFetch<void>(`/api/billing/plans/${encodeURIComponent(planId)}`, { method: 'DELETE' })
    }

    async listMyInvoices(filters: InvoiceFilters): Promise<{ invoices: Invoice[]; total: number }> {
        return apiFetch<{ invoices: Invoice[]; total: number }>(`/api/billing/my/invoices${queryString(filters)}`)
    }

    async listInvoices(filters: InvoiceFilters): Promise<{ invoices: Invoice[]; total: number }> {
        return apiFetch<{ invoices: Invoice[]; total: number }>(`/api/billing/invoices${queryString(filters)}`)
    }

    async createInvoice(draft: InvoiceDraft): Promise<Invoice> {
        return apiFetch<Invoice>('/api/billing/invoices', { method: 'POST', body: JSON.stringify(draft) })
    }

    async setInvoiceStatus(invoiceId: string, status: InvoiceStatus): Promise<Invoice> {
        return apiFetch<Invoice>(`/api/billing/invoices/${encodeURIComponent(invoiceId)}`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        })
    }

    async fetchMyEnquiry(): Promise<SalesEnquiry | null> {
        const { enquiry } = await apiFetch<{ enquiry: SalesEnquiry | null }>('/api/billing/my/enquiry')
        return enquiry
    }

    async createEnquiry(draft: SalesEnquiryDraft): Promise<SalesEnquiry> {
        return apiFetch<SalesEnquiry>('/api/billing/enquiries', { method: 'POST', body: JSON.stringify(draft) })
    }

    async listEnquiries(filters: EnquiryFilters): Promise<{ enquiries: SalesEnquiry[]; total: number }> {
        return apiFetch<{ enquiries: SalesEnquiry[]; total: number }>(`/api/billing/admin/enquiries${queryString(filters)}`)
    }

    async setEnquiryStatus(enquiryId: string, status: EnquiryStatus): Promise<SalesEnquiry> {
        return apiFetch<SalesEnquiry>(`/api/billing/enquiries/${encodeURIComponent(enquiryId)}`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        })
    }

    async fetchPublicConstants(): Promise<PublicConstants> {
        return apiFetch<PublicConstants>('/api/public/constants')
    }

    async listEnquiryEvents(enquiryId: string): Promise<SalesEnquiryEvent[]> {
        return apiFetch<SalesEnquiryEvent[]>(`/api/billing/enquiries/${encodeURIComponent(enquiryId)}/events`)
    }

    async applyEnquiryAction(enquiryId: string, draft: EnquiryActionDraft): Promise<EnquiryActionResult> {
        return apiFetch<EnquiryActionResult>(`/api/billing/enquiries/${encodeURIComponent(enquiryId)}/actions`, {
            method: 'POST',
            body: JSON.stringify(draft),
        })
    }

    async fetchPublicInvoice(token: string): Promise<PublicInvoice> {
        return apiFetch<PublicInvoice>(`/api/billing/public/invoices/${encodeURIComponent(token)}`)
    }

    async fetchFeatureFlags(): Promise<FeatureFlags> {
        return apiFetch<FeatureFlags>('/api/settings/features')
    }

    async saveFeatureFlags(next: Partial<FeatureFlags>): Promise<FeatureFlags> {
        return apiFetch<FeatureFlags>('/api/settings/features', {
            method: 'PUT',
            body: JSON.stringify(next),
        })
    }
}

export default BillingService
