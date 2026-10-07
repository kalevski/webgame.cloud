import { StateCreator } from 'zustand'
import BillingService from 'services/BillingService'
import { STRINGS } from 'configs/strings'
import {
    BillingEvent,
    BillingEventFilters,
    CheckoutIntent,
    EnquiryActionDraft,
    EnquiryFilters,
    EnquiryStatus,
    FeatureFlags,
    Invoice,
    InvoiceFilters,
    InvoiceStatus,
    LimitUsage,
    NO_SUBSCRIPTION,
    Plan,
    PlanDraft,
    PublicConstants,
    SalesEnquiry,
    SalesEnquiryEvent,
    SalesEnquiryDraft,
    Subscription,
} from 'types'
import type { AppStore } from './index'
import { fail } from './alerts.slice'

export type BillingSlice = {
    plans: Plan[]
    subscription: Subscription
    billingLoaded: boolean

    featureFlags: FeatureFlags | null

    fetchBilling: () => Promise<void>

    accountUsage: LimitUsage[]
    accountUsageLoaded: boolean
    fetchAccountUsage: () => Promise<void>

    myEnquiry: SalesEnquiry | null
    startCheckout: (planId: string) => Promise<CheckoutIntent | null>
    cancelSubscription: () => Promise<boolean>
    resumeSubscription: () => Promise<boolean>
    changeSubscriptionPlan: (planId: string) => Promise<boolean>
    openBillingPortal: () => Promise<boolean>

    fetchFeatureFlags: () => Promise<void>
    saveFeatureFlag: (flag: keyof FeatureFlags, enabled: boolean) => Promise<boolean>

    adminPlans: Plan[]
    adminPlansLoaded: boolean
    fetchAdminPlans: () => Promise<void>
    createPlan: (draft: PlanDraft) => Promise<Plan | null>
    updatePlan: (planId: string, patch: Partial<PlanDraft>) => Promise<Plan | null>
    deletePlan: (planId: string) => Promise<boolean>

    invoices: Invoice[]
    invoicesTotal: number
    invoicesLoading: boolean
    invoiceFilters: InvoiceFilters
    fetchInvoices: (filters?: InvoiceFilters) => Promise<void>
    setInvoiceStatus: (invoiceId: string, status: InvoiceStatus) => Promise<boolean>

    enquiries: SalesEnquiry[]
    enquiriesTotal: number
    enquiriesLoading: boolean
    enquiryFilters: EnquiryFilters
    submitEnquiry: (draft: SalesEnquiryDraft) => Promise<SalesEnquiry | null>
    fetchEnquiries: (filters?: EnquiryFilters) => Promise<void>
    setEnquiryStatus: (enquiryId: string, status: EnquiryStatus) => Promise<boolean>

    enquiryEvents: SalesEnquiryEvent[]
    enquiryEventsLoading: boolean
    fetchEnquiryEvents: (enquiryId: string) => Promise<void>
    applyEnquiryAction: (enquiryId: string, draft: EnquiryActionDraft) => Promise<boolean>

    publicConstants: PublicConstants | null
    fetchPublicConstants: () => Promise<void>

    myInvoices: Invoice[]
    myInvoicesTotal: number
    myInvoicesLoading: boolean
    myInvoiceFilters: InvoiceFilters
    fetchMyInvoices: (filters?: InvoiceFilters) => Promise<void>

    billingEvents: BillingEvent[]
    billingEventsTotal: number
    billingEventsLoading: boolean
    billingEventFilters: BillingEventFilters
    fetchBillingEvents: (filters?: BillingEventFilters) => Promise<void>
    replayBillingEvent: (eventId: string) => Promise<boolean>
}

export const createBillingSlice: StateCreator<AppStore, [], [], BillingSlice> = (set, get) => ({
    plans: [],
    subscription: NO_SUBSCRIPTION,
    billingLoaded: false,
    myEnquiry: null,
    featureFlags: null,
    adminPlans: [],
    adminPlansLoaded: false,
    invoices: [],
    invoicesTotal: 0,
    invoicesLoading: false,
    invoiceFilters: { limit: 20, offset: 0 },
    enquiries: [],
    enquiriesTotal: 0,
    enquiriesLoading: false,
    enquiryFilters: { limit: 20, offset: 0 },
    enquiryEvents: [],
    enquiryEventsLoading: false,
    publicConstants: null,
    accountUsage: [],
    accountUsageLoaded: false,
    myInvoices: [],
    myInvoicesTotal: 0,
    myInvoicesLoading: false,
    myInvoiceFilters: { limit: 20, offset: 0 },

    billingEvents: [],
    billingEventsTotal: 0,
    billingEventsLoading: false,
    billingEventFilters: { limit: 20, offset: 0 },

    async fetchBilling() {
        try {
            const [plans, subscription, myEnquiry] = await Promise.all([
                BillingService.getInstance().listPlans(),
                BillingService.getInstance().fetchSubscription(),
                BillingService.getInstance().fetchMyEnquiry(),
            ])
            set({ plans, subscription, myEnquiry, billingLoaded: true })
        } catch {
            set({ billingLoaded: true })
        }
    },

    async fetchAccountUsage() {
        try {
            const { usage } = await BillingService.getInstance().accountUsage()
            set({ accountUsage: usage, accountUsageLoaded: true })
        } catch {
            set({ accountUsageLoaded: true })
        }
    },

    async startCheckout(planId) {
        try {
            const intent = await BillingService.getInstance().startCheckout(planId)
            if (intent.outcome === 'redirect' && intent.redirectUrl) {
                window.location.href = intent.redirectUrl
                return intent
            }
            if (intent.outcome === 'activated') {
                await get().fetchBilling()
                void get().refreshSession()
                get().addAlert({ variant: 'success', message: STRINGS.alerts.subscriptionActivated, dismissible: true })
                return intent
            }
            return intent
        } catch (error) {
            fail(get, error, STRINGS.alerts.checkoutFailed)
            return null
        }
    },

    async cancelSubscription() {
        try {
            const subscription = await BillingService.getInstance().cancel()
            set({ subscription })
            void get().refreshSession()
            get().addAlert({ variant: 'success', message: STRINGS.alerts.subscriptionCanceled, dismissible: true })
            return true
        } catch (error) {
            fail(get, error, STRINGS.alerts.subscriptionCancelFailed)
            return false
        }
    },

    async resumeSubscription() {
        try {
            const subscription = await BillingService.getInstance().resume()
            set({ subscription })
            void get().refreshSession()
            get().addAlert({ variant: 'success', message: STRINGS.alerts.subscriptionResumed, dismissible: true })
            return true
        } catch (error) {
            fail(get, error, STRINGS.alerts.subscriptionResumeFailed)
            return false
        }
    },

    async changeSubscriptionPlan(planId) {
        try {
            const subscription = await BillingService.getInstance().changePlan(planId)
            set({ subscription })
            get().addAlert({ variant: 'success', message: STRINGS.alerts.planChangeRequested, dismissible: true })
            return true
        } catch (error) {
            fail(get, error, STRINGS.alerts.planChangeFailed)
            return false
        }
    },

    async openBillingPortal() {
        try {
            const { url } = await BillingService.getInstance().portal()
            window.location.href = url
            return true
        } catch (error) {
            fail(get, error, STRINGS.alerts.portalUnavailable)
            return false
        }
    },

    async fetchAdminPlans() {
        try {
            set({ adminPlans: await BillingService.getInstance().listAllPlans(), adminPlansLoaded: true })
        } catch (error) {
            set({ adminPlansLoaded: true })
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async createPlan(draft) {
        try {
            const plan = await BillingService.getInstance().createPlan(draft)
            await get().fetchAdminPlans()
            void get().fetchBilling()
            get().addAlert({ variant: 'success', message: STRINGS.alerts.planSaved, dismissible: true })
            return plan
        } catch (error) {
            fail(get, error, STRINGS.alerts.planFailed)
            return null
        }
    },

    async updatePlan(planId, patch) {
        try {
            const plan = await BillingService.getInstance().updatePlan(planId, patch)
            await get().fetchAdminPlans()
            void get().fetchBilling()
            get().addAlert({ variant: 'success', message: STRINGS.alerts.planSaved, dismissible: true })
            return plan
        } catch (error) {
            fail(get, error, STRINGS.alerts.planFailed)
            return null
        }
    },

    async deletePlan(planId) {
        try {
            await BillingService.getInstance().deletePlan(planId)
            await get().fetchAdminPlans()
            void get().fetchBilling()
            get().addAlert({ variant: 'success', message: STRINGS.alerts.planDeleted, dismissible: true })
            return true
        } catch (error) {
            fail(get, error, STRINGS.alerts.planFailed)
            return false
        }
    },

    async fetchInvoices(filters) {
        const next = { ...get().invoiceFilters, ...filters }
        set({ invoicesLoading: true, invoiceFilters: next })
        try {
            const { invoices, total } = await BillingService.getInstance().listInvoices(next)
            set({ invoices, invoicesTotal: total, invoicesLoading: false })
        } catch (error) {
            set({ invoicesLoading: false })
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async setInvoiceStatus(invoiceId, status) {
        try {
            const saved = await BillingService.getInstance().setInvoiceStatus(invoiceId, status)
            set({ invoices: get().invoices.map((invoice) => (invoice.id === saved.id ? saved : invoice)) })
            get().addAlert({ variant: 'success', message: STRINGS.alerts.invoiceSaved, dismissible: true })
            return true
        } catch (error) {
            fail(get, error, STRINGS.alerts.invoiceFailed)
            return false
        }
    },

    async submitEnquiry(draft) {
        try {
            const enquiry = await BillingService.getInstance().createEnquiry(draft)
            set({ myEnquiry: enquiry })
            get().addAlert({ variant: 'success', message: STRINGS.alerts.enquirySent, dismissible: true })
            return enquiry
        } catch (error) {
            fail(get, error, STRINGS.alerts.enquiryFailed)
            return null
        }
    },

    async fetchEnquiries(filters) {
        const next = { ...get().enquiryFilters, ...filters }
        set({ enquiriesLoading: true, enquiryFilters: next })
        try {
            const { enquiries, total } = await BillingService.getInstance().listEnquiries(next)
            set({ enquiries, enquiriesTotal: total, enquiriesLoading: false })
        } catch (error) {
            set({ enquiriesLoading: false })
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async setEnquiryStatus(enquiryId, status) {
        try {
            const saved = await BillingService.getInstance().setEnquiryStatus(enquiryId, status)
            set({ enquiries: get().enquiries.map((entry) => (entry.id === saved.id ? saved : entry)) })
            get().addAlert({ variant: 'success', message: STRINGS.alerts.enquirySaved, dismissible: true })
            return true
        } catch (error) {
            fail(get, error, STRINGS.alerts.enquiryFailed)
            return false
        }
    },

    async fetchEnquiryEvents(enquiryId) {
        set({ enquiryEventsLoading: true })
        try {
            const enquiryEvents = await BillingService.getInstance().listEnquiryEvents(enquiryId)
            set({ enquiryEvents, enquiryEventsLoading: false })
        } catch (error) {
            set({ enquiryEventsLoading: false })
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async applyEnquiryAction(enquiryId, draft) {
        try {
            const result = await BillingService.getInstance().applyEnquiryAction(enquiryId, draft)
            set({
                enquiries: get().enquiries.map((entry) => (entry.id === enquiryId ? result.enquiry : entry)),
                enquiryEvents: [result.event, ...get().enquiryEvents],
            })
            get().addAlert({ variant: 'success', message: STRINGS.alerts.enquiryActionSaved, dismissible: true })
            return true
        } catch (error) {
            fail(get, error, STRINGS.alerts.enquiryFailed)
            return false
        }
    },

    async fetchMyInvoices(filters) {
        const next = { ...get().myInvoiceFilters, ...filters }
        set({ myInvoicesLoading: true, myInvoiceFilters: next })
        try {
            const { invoices, total } = await BillingService.getInstance().listMyInvoices(next)
            set({ myInvoices: invoices, myInvoicesTotal: total, myInvoicesLoading: false })
        } catch (error) {
            set({ myInvoicesLoading: false })
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async fetchBillingEvents(filters) {
        const next = { ...get().billingEventFilters, ...filters }
        set({ billingEventsLoading: true, billingEventFilters: next })
        try {
            const { events, total } = await BillingService.getInstance().listBillingEvents(next)
            set({ billingEvents: events, billingEventsTotal: total, billingEventsLoading: false })
        } catch (error) {
            set({ billingEventsLoading: false })
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async replayBillingEvent(eventId) {
        try {
            const replayed = await BillingService.getInstance().replayBillingEvent(eventId)
            set({ billingEvents: get().billingEvents.map((event) => (event.id === replayed.id ? replayed : event)) })
            get().addAlert({ variant: 'success', message: STRINGS.alerts.billingEventReplayed, dismissible: true })
            return true
        } catch (error) {
            fail(get, error, STRINGS.alerts.billingEventReplayFailed)
            return false
        }
    },

    async fetchPublicConstants() {
        try {
            set({ publicConstants: await BillingService.getInstance().fetchPublicConstants() })
        } catch {
            set({ publicConstants: null })
        }
    },

    async fetchFeatureFlags() {
        try {
            set({ featureFlags: await BillingService.getInstance().fetchFeatureFlags() })
        } catch (error) {
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async saveFeatureFlag(flag, enabled) {
        const previous = get().featureFlags
        try {
            const featureFlags = await BillingService.getInstance().saveFeatureFlags({ [flag]: enabled })
            set({ featureFlags })
            get().addAlert({ variant: 'success', message: STRINGS.alerts.featureFlagSaved, dismissible: true })
            return true
        } catch (error) {
            set({ featureFlags: previous })
            fail(get, error, STRINGS.alerts.featureFlagFailed)
            return false
        }
    },
})
