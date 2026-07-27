import { StateCreator } from 'zustand'
import EmailService from 'services/EmailService'
import { STRINGS } from 'configs/strings'
import {
    EmailComposeDraft,
    EmailConfig,
    EmailConfigDraft,
    EmailFilters,
    EmailMessage,
    EmailRecipientOption,
    EmailStats,
    EmailStatus,
    EmailTemplate,
    EmailTemplateDraft,
    EmailTrigger,
    EmailTriggerDraft,
} from 'types'
import type { AppStore } from './index'

const fail = (get: () => AppStore, error: unknown, fallback: string) =>
    get().addAlert({
        variant: 'danger',
        message: error instanceof Error ? error.message : fallback,
        dismissible: true,
    })

const NO_STATS: EmailStats = { queued: 0, sending: 0, sent: 0, failed: 0, canceled: 0 }

export type EmailSlice = {
    emailConfig: EmailConfig | null
    emailTemplates: EmailTemplate[]
    emailTriggers: EmailTrigger[]
    emailActions: string[]
    emailRecipients: EmailRecipientOption[]

    emailMessages: EmailMessage[]
    emailTotal: number
    emailStats: EmailStats
    emailLoading: boolean
    emailFilters: EmailFilters

    fetchEmailConfig: () => Promise<void>
    saveEmailConfig: (draft: EmailConfigDraft) => Promise<boolean>
    sendTestEmail: () => Promise<boolean>

    fetchEmailTemplates: () => Promise<void>
    saveEmailTemplate: (key: string | null, draft: EmailTemplateDraft) => Promise<EmailTemplate | null>
    deleteEmailTemplate: (key: string) => Promise<boolean>

    fetchEmailTriggers: () => Promise<void>
    fetchEmailActions: () => Promise<void>
    fetchEmailRecipients: () => Promise<void>
    saveEmailTrigger: (draft: EmailTriggerDraft) => Promise<boolean>
    deleteEmailTrigger: (id: string) => Promise<boolean>

    fetchEmailMessages: (filters?: EmailFilters) => Promise<void>
    composeEmail: (draft: EmailComposeDraft) => Promise<number | null>
    setEmailMessageStatus: (id: string, status: EmailStatus) => Promise<boolean>
}

export const createEmailSlice: StateCreator<AppStore, [], [], EmailSlice> = (set, get) => ({
    emailConfig: null,
    emailTemplates: [],
    emailTriggers: [],
    emailActions: [],
    emailRecipients: [],
    emailMessages: [],
    emailTotal: 0,
    emailStats: NO_STATS,
    emailLoading: false,
    emailFilters: { limit: 25, offset: 0 },

    async fetchEmailConfig() {
        try {
            set({ emailConfig: await EmailService.getInstance().fetchConfig() })
        } catch (error) {
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async saveEmailConfig(draft) {
        try {
            set({ emailConfig: await EmailService.getInstance().saveConfig(draft) })
            get().addAlert({ variant: 'success', message: STRINGS.alerts.emailConfigSaved, dismissible: true })
            return true
        } catch (error) {
            fail(get, error, STRINGS.alerts.emailFailed)
            return false
        }
    },

    async sendTestEmail() {
        try {
            await EmailService.getInstance().sendTest()
            get().addAlert({ variant: 'success', message: STRINGS.email.testQueued, dismissible: true })
            void get().fetchEmailMessages()
            return true
        } catch (error) {
            fail(get, error, STRINGS.alerts.emailFailed)
            return false
        }
    },

    async fetchEmailTemplates() {
        try {
            set({ emailTemplates: await EmailService.getInstance().listTemplates() })
        } catch (error) {
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async saveEmailTemplate(key, draft) {
        try {
            const saved = key
                ? await EmailService.getInstance().updateTemplate(key, draft)
                : await EmailService.getInstance().createTemplate(draft)
            await get().fetchEmailTemplates()
            get().addAlert({ variant: 'success', message: STRINGS.email.templateSaved, dismissible: true })
            return saved
        } catch (error) {
            fail(get, error, STRINGS.alerts.emailFailed)
            return null
        }
    },

    async deleteEmailTemplate(key) {
        try {
            await EmailService.getInstance().deleteTemplate(key)
            await get().fetchEmailTemplates()
            return true
        } catch (error) {
            fail(get, error, STRINGS.alerts.emailFailed)
            return false
        }
    },

    async fetchEmailTriggers() {
        try {
            set({ emailTriggers: await EmailService.getInstance().listTriggers() })
        } catch (error) {
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async fetchEmailActions() {
        try {
            set({ emailActions: await EmailService.getInstance().listAuditActions() })
        } catch (error) {
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async fetchEmailRecipients() {
        try {
            set({ emailRecipients: await EmailService.getInstance().listRecipients() })
        } catch (error) {
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async saveEmailTrigger(draft) {
        try {
            await EmailService.getInstance().saveTrigger(draft)
            await get().fetchEmailTriggers()
            get().addAlert({ variant: 'success', message: STRINGS.email.triggerSaved, dismissible: true })
            return true
        } catch (error) {
            fail(get, error, STRINGS.alerts.emailFailed)
            return false
        }
    },

    async deleteEmailTrigger(id) {
        try {
            await EmailService.getInstance().deleteTrigger(id)
            await get().fetchEmailTriggers()
            return true
        } catch (error) {
            fail(get, error, STRINGS.alerts.emailFailed)
            return false
        }
    },

    async fetchEmailMessages(filters) {
        const next = { ...get().emailFilters, ...filters }
        set({ emailLoading: true, emailFilters: next })
        try {
            const { messages, total, stats } = await EmailService.getInstance().listMessages(next)
            set({ emailMessages: messages, emailTotal: total, emailStats: stats, emailLoading: false })
        } catch (error) {
            set({ emailLoading: false })
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async composeEmail(draft) {
        try {
            const result = await EmailService.getInstance().compose(draft)
            await get().fetchEmailMessages({ offset: 0 })
            get().addAlert({ variant: 'success', message: STRINGS.email.queued(result.queued), dismissible: true })
            return result.queued
        } catch (error) {
            fail(get, error, STRINGS.alerts.emailFailed)
            return null
        }
    },

    async setEmailMessageStatus(id, status) {
        try {
            const saved = await EmailService.getInstance().setMessageStatus(id, status)
            set({ emailMessages: get().emailMessages.map((entry) => (entry.id === saved.id ? saved : entry)) })
            get().addAlert({ variant: 'success', message: STRINGS.alerts.emailMessageUpdated, dismissible: true })
            return true
        } catch (error) {
            fail(get, error, STRINGS.alerts.emailFailed)
            return false
        }
    },
})
