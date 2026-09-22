import { apiFetch } from 'helpers/api'
import { queryString } from 'helpers/query'
import {
    EmailComposeDraft,
    EmailComposeResult,
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

class EmailService {
    private static instance: EmailService
    private constructor() {}

    static getInstance(): EmailService {
        if (!EmailService.instance) EmailService.instance = new EmailService()
        return EmailService.instance
    }

    async fetchConfig(): Promise<EmailConfig> {
        return apiFetch<EmailConfig>('/api/email/config')
    }

    async saveConfig(draft: EmailConfigDraft): Promise<EmailConfig> {
        return apiFetch<EmailConfig>('/api/email/config', { method: 'PUT', body: JSON.stringify(draft) })
    }

    async sendTest(): Promise<EmailMessage> {
        return apiFetch<EmailMessage>('/api/email/config/test', { method: 'POST', body: JSON.stringify({}) })
    }

    async listTemplates(): Promise<EmailTemplate[]> {
        return apiFetch<EmailTemplate[]>('/api/email/templates')
    }

    async createTemplate(draft: EmailTemplateDraft): Promise<EmailTemplate> {
        return apiFetch<EmailTemplate>('/api/email/templates', { method: 'POST', body: JSON.stringify(draft) })
    }

    async updateTemplate(key: string, draft: Partial<EmailTemplateDraft>): Promise<EmailTemplate> {
        return apiFetch<EmailTemplate>(`/api/email/templates/${encodeURIComponent(key)}`, {
            method: 'PATCH',
            body: JSON.stringify(draft),
        })
    }

    async deleteTemplate(key: string): Promise<void> {
        await apiFetch<void>(`/api/email/templates/${encodeURIComponent(key)}`, { method: 'DELETE' })
    }

    async listTriggers(): Promise<EmailTrigger[]> {
        return apiFetch<EmailTrigger[]>('/api/email/triggers')
    }

    async saveTrigger(draft: EmailTriggerDraft): Promise<EmailTrigger> {
        return apiFetch<EmailTrigger>('/api/email/triggers', { method: 'POST', body: JSON.stringify(draft) })
    }

    async deleteTrigger(id: string): Promise<void> {
        await apiFetch<void>(`/api/email/triggers/${encodeURIComponent(id)}`, { method: 'DELETE' })
    }

    async listAuditActions(): Promise<string[]> {
        return apiFetch<string[]>('/api/email/audit-actions')
    }

    async listRecipients(): Promise<EmailRecipientOption[]> {
        return apiFetch<EmailRecipientOption[]>('/api/email/recipients')
    }

    async listMessages(filters: EmailFilters): Promise<{ messages: EmailMessage[]; total: number; stats: EmailStats }> {
        return apiFetch<{ messages: EmailMessage[]; total: number; stats: EmailStats }>(
            `/api/email/messages${queryString(filters)}`
        )
    }

    async compose(draft: EmailComposeDraft): Promise<EmailComposeResult> {
        return apiFetch<EmailComposeResult>('/api/email/messages', { method: 'POST', body: JSON.stringify(draft) })
    }

    async setMessageStatus(id: string, status: EmailStatus): Promise<EmailMessage> {
        return apiFetch<EmailMessage>(`/api/email/messages/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        })
    }
}

export default EmailService
